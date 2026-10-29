import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { GenerateQuestionOptions, Question, Subject } from '../types';

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'] as const;

const SYLLABUS_PDFS: Record<Subject, number> = {
  romana: require('../../programa-de-examen-la-limba-romana-pentru-evaluarea-nationala-2026.pdf'),
  matematica: require('../../programa-de-examen-la-matematica-pentru-evaluarea-nationala-2026.pdf'),
};

const RECENT_QUESTION_LIMIT = 40;
const PROMPT_EXCLUSION_LIMIT = 12;
const QUESTION_BATCH_SIZE = 5;
const QUESTION_BATCH_CANDIDATE_COUNT = 6;
const QUESTION_BATCH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          prompt: { type: 'string' },
          context: { type: 'string', nullable: true },
          choices: { type: 'array', items: { type: 'string' } },
          answer: { type: 'integer', minimum: 0, maximum: 3 },
          explanation: { type: 'string' },
          hint: { type: 'string' },
          competency: { type: 'string' },
          examSection: { type: 'string' },
        },
        required: ['topic', 'prompt', 'choices', 'answer', 'explanation'],
        propertyOrdering: [
          'topic',
          'prompt',
          'context',
          'choices',
          'answer',
          'explanation',
          'hint',
          'competency',
          'examSection',
        ],
      },
    },
  },
  required: ['questions'],
  propertyOrdering: ['questions'],
};

type GeneratedQuestion = {
  topic: string;
  prompt: string;
  context?: string | null;
  choices: string[];
  answer: number;
  explanation: string;
  hint?: string;
  competency?: string;
  examSection?: string;
};

type RecentQuestion = Pick<
  GeneratedQuestion,
  'topic' | 'competency' | 'prompt' | 'context' | 'choices'
>;

const recentQuestions: Record<Subject, RecentQuestion[]> = {
  romana: [],
  matematica: [],
};
const loadedQuestionHistory = new Set<Subject>();
const questionQueues = new Map<string, Question[]>();
const pendingBatchRequests = new Map<string, Promise<void>>();

let cachedSyllabus: { subject: Subject; base64: string } | undefined;

async function loadSyllabus(subject: Subject): Promise<string> {
  if (cachedSyllabus?.subject === subject) return cachedSyllabus.base64;

  const asset = await Asset.fromModule(SYLLABUS_PDFS[subject]).downloadAsync();
  let base64: string;

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    if (!response.ok) {
      throw new Error(`Programa PDF nu a putut fi citită (HTTP ${response.status}).`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    base64 = btoa(binary);
  } else {
    if (!asset.localUri) {
      throw new Error('Programa oficială nu a putut fi încărcată din aplicație.');
    }

    const { File } = await import('expo-file-system');
    base64 = await new File(asset.localUri).base64();
  }

  cachedSyllabus = { subject, base64 };
  return base64;
}

function normalizePrompt(prompt: string): string {
  return prompt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ro')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function questionSignature(question: RecentQuestion): string {
  const promptTemplate = question.prompt.replace(/„[^”]*”|“[^”]*”|"[^"]*"/g, ' text ');
  return normalizePrompt(promptTemplate);
}

function areSimilarQuestions(first: RecentQuestion, second: RecentQuestion): boolean {
  const firstText = questionSignature(first);
  const secondText = questionSignature(second);
  if (firstText === secondText) return true;

  const firstWords = new Set(firstText.split(' ').filter((word) => word.length > 2));
  const secondWords = new Set(secondText.split(' ').filter((word) => word.length > 2));
  const smallerSet = firstWords.size <= secondWords.size ? firstWords : secondWords;
  const largerSet = smallerSet === firstWords ? secondWords : firstWords;
  if (smallerSet.size < 6) return false;

  let sharedWords = 0;
  for (const word of smallerSet) {
    if (largerSet.has(word)) sharedWords += 1;
  }

  return sharedWords / smallerSet.size >= 0.7 && sharedWords / largerSet.size >= 0.5;
}

function isRecentQuestion(value: unknown): value is RecentQuestion {
  if (!value || typeof value !== 'object') return false;
  const question = value as Partial<RecentQuestion>;
  return (
    typeof question.prompt === 'string' &&
    (question.topic === undefined || typeof question.topic === 'string') &&
    (question.competency === undefined || typeof question.competency === 'string') &&
    Array.isArray(question.choices) &&
    question.choices.every((choice) => typeof choice === 'string')
  );
}

async function loadQuestionHistory(subject: Subject): Promise<RecentQuestion[]> {
  if (loadedQuestionHistory.has(subject)) return recentQuestions[subject];

  try {
    const stored = await AsyncStorage.getItem(`gemini_recent_questions_${subject}`);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        recentQuestions[subject] = parsed.filter(isRecentQuestion);
      }
    }
  } catch (error) {
    console.warn('Could not load recent Gemini question history:', error);
  }

  recentQuestions[subject] = recentQuestions[subject].slice(0, RECENT_QUESTION_LIMIT);
  loadedQuestionHistory.add(subject);
  return recentQuestions[subject];
}

function parseGeneratedQuestion(value: unknown): GeneratedQuestion {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini a returnat o întrebare într-un format incomplet.');
  }

  const parsed = value as Partial<GeneratedQuestion>;
  if (
    typeof parsed.topic !== 'string' ||
    typeof parsed.prompt !== 'string' ||
    typeof parsed.explanation !== 'string' ||
    !Array.isArray(parsed.choices) ||
    parsed.choices.length !== 4 ||
    !parsed.choices.every((choice) => typeof choice === 'string') ||
    !Number.isInteger(parsed.answer) ||
    (parsed.answer as number) < 0 ||
    (parsed.answer as number) > 3
  ) {
    throw new Error('Gemini a returnat o întrebare într-un format incomplet. Încearcă din nou.');
  }

  return parsed as GeneratedQuestion;
}

function parseJsonResponse(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    const repaired = cleaned
      .replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u')
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    return JSON.parse(repaired) as unknown;
  }
}

function parseGeneratedQuestionBatch(text: string): GeneratedQuestion[] {
  const parsed = parseJsonResponse(text);
  const questions =
    parsed && typeof parsed === 'object' && 'questions' in parsed
      ? (parsed as { questions?: unknown }).questions
      : undefined;

  if (!Array.isArray(questions)) {
    throw new Error('Gemini nu a returnat lotul de întrebări în formatul așteptat.');
  }

  const validQuestions = questions.flatMap((question) => {
    try {
      return [parseGeneratedQuestion(question)];
    } catch {
      return [];
    }
  });

  if (validQuestions.length === 0) {
    throw new Error('Gemini nu a returnat întrebări valide în lot.');
  }

  return validQuestions;
}

function toQuestion(
  generated: GeneratedQuestion,
  options: GenerateQuestionOptions,
  index: number
): Question {
  return {
    id: `ai-gen-${Date.now()}-${index}`,
    subject: options.subject,
    grade: options.grade,
    topic: generated.topic,
    prompt: generated.prompt,
    context: generated.context || undefined,
    choices: generated.choices,
    answer: generated.answer,
    explanation: generated.explanation,
    hint: generated.hint,
    difficulty: options.difficulty,
    competency: generated.competency,
    examSection: generated.examSection as Question['examSection'],
    points: 5,
    sourceSyllabus: 'Programa Oficială Evaluarea Națională 2026 (PDF)',
    isAiGenerated: true,
  };
}

async function requestQuestionBatch(
  options: GenerateQuestionOptions,
  apiKey: string,
  syllabusBase64: string,
  excludedQuestions: RecentQuestion[]
): Promise<GeneratedQuestion[]> {
  const { subject, grade, difficulty, topic } = options;
  const subjectName = subject === 'romana' ? 'Limba și literatura română' : 'Matematică';
  const prompt = `
Ești profesor și autor de subiecte pentru Evaluarea Națională din România.
Analizează PDF-ul atașat, programa oficială pentru ${subjectName}, și creează ${QUESTION_BATCH_CANDIDATE_COUNT} întrebări candidate originale, verificabile și potrivite programei. Aplicația va elimina duplicatele și va păstra maximum ${QUESTION_BATCH_SIZE} întrebări unice.

Materia: ${subjectName}
Clasa selectată: ${grade}
Dificultate: ${difficulty}
${topic ? `Temă cerută: ${topic}` : ''}

Folosește strict competențele și conținuturile din PDF. Întrebările trebuie să testeze competențe și subiecte diferite; creează contexte, texte, date și cerințe distincte, nu variații minore ale aceleiași întrebări. Nu folosi aceeași structură de cerință de mai mult de două ori în lot. Verifică să nu se repete ideea sau competența îngustă între întrebările lotului și să nu se repete nicio întrebare din istoricul de mai jos:
${excludedQuestions.length > 0
  ? excludedQuestions
    .slice(0, PROMPT_EXCLUSION_LIMIT)
    .map((item) => `- Domeniu: ${item.topic ?? 'nespecificat'}; competență: ${item.competency ?? 'nespecificată'}; cerință: ${item.prompt}`)
    .join('\n')
  : '- Nu există întrebări recente.'}

Pentru matematică, verifică atent calculele și faptul că există o singură variantă corectă. Pentru română, folosește corect limba română și oferă suficient context.

Răspunde în română și exclusiv ca JSON valid cu forma următoare. Fiecare explicație să aibă cel mult două propoziții, ca toate cele ${QUESTION_BATCH_CANDIDATE_COUNT} întrebări să încapă în răspuns:
{
  "questions": [
    {
      "topic": "Domeniul din programă",
      "prompt": "Enunț original",
      "context": null,
      "choices": ["Varianta A", "Varianta B", "Varianta C", "Varianta D"],
      "answer": 0,
      "explanation": "Explicație și rezolvare în cel mult două propoziții",
      "hint": "Indiciu scurt",
      "competency": "Competența vizată, conform PDF-ului",
      "examSection": "Subiectul I"
    }
  ]
}
Include exact ${QUESTION_BATCH_CANDIDATE_COUNT} elemente în questions. Indicele răspunsului corect trebuie să fie între 0 și 3. Nu include text în afara JSON-ului.
`;

  for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex += 1) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS[modelIndex]}:generateContent`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: syllabusBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: QUESTION_BATCH_RESPONSE_SCHEMA,
          temperature: 0.9,
          maxOutputTokens: 3072,
        },
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | {
          error?: { message?: string };
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        }
      | null;

    if (!response.ok) {
      const isTemporaryFailure = [429, 500, 502, 503, 504].includes(response.status);
      if (isTemporaryFailure && modelIndex < GEMINI_MODELS.length - 1) continue;
      throw new Error(data?.error?.message || `Gemini a returnat eroarea HTTP ${response.status}.`);
    }

    const jsonText = data?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!jsonText) {
      throw new Error('Gemini nu a returnat o întrebare. Încearcă din nou.');
    }

    try {
      return parseGeneratedQuestionBatch(jsonText);
    } catch (error) {
      if (modelIndex < GEMINI_MODELS.length - 1) continue;
      throw new Error(
        error instanceof Error
          ? `Gemini a returnat un răspuns JSON invalid: ${error.message}`
          : 'Gemini a returnat un răspuns JSON invalid. Încearcă din nou.'
      );
    }
  }

  throw new Error('Modelele Gemini sunt momentan indisponibile. Încearcă din nou în câteva momente.');
}

function isStoredQuestion(value: unknown, options: GenerateQuestionOptions): value is Question {
  if (!value || typeof value !== 'object') return false;
  const question = value as Partial<Question>;
  return (
    question.subject === options.subject &&
    question.grade === options.grade &&
    question.difficulty === options.difficulty &&
    typeof question.prompt === 'string' &&
    typeof question.topic === 'string' &&
    typeof question.explanation === 'string' &&
    Array.isArray(question.choices) &&
    question.choices.length === 4 &&
    Number.isInteger(question.answer) &&
    (question.answer as number) >= 0 &&
    (question.answer as number) <= 3
  );
}

function queueStorageKey(options: GenerateQuestionOptions): string {
  const topic = normalizePrompt(options.topic ?? 'toate').replace(/\s+/g, '_');
  return [
    'gemini_question_batch_v1',
    options.subject,
    normalizePrompt(options.grade).replace(/\s+/g, '_'),
    normalizePrompt(options.difficulty).replace(/\s+/g, '_'),
    topic,
  ].join('_');
}

async function saveQuestionHistory(subject: Subject, recentQuestion: RecentQuestion): Promise<void> {
  const history = await loadQuestionHistory(subject);
  history.unshift(recentQuestion);
  history.splice(RECENT_QUESTION_LIMIT);
  recentQuestions[subject] = history;
  await AsyncStorage.setItem(`gemini_recent_questions_${subject}`, JSON.stringify(history)).catch(
    (error) => console.warn('Could not save recent Gemini question history:', error)
  );
}

async function createQuestionBatch(
  options: GenerateQuestionOptions,
  apiKey: string,
  storageKey: string
): Promise<void> {
  const [syllabusBase64, history] = await Promise.all([
    loadSyllabus(options.subject),
    loadQuestionHistory(options.subject),
  ]);
  const generatedQuestions = await requestQuestionBatch(
    options,
    apiKey,
    syllabusBase64,
    history.slice(0, PROMPT_EXCLUSION_LIMIT)
  );
  const queuedQuestions = questionQueues.get(storageKey) ?? [];
  const uniqueQuestions: Question[] = [];
  const seenQuestions = [
    ...history,
    ...queuedQuestions.map((question) => ({
      topic: question.topic,
      competency: question.competency,
      prompt: question.prompt,
      context: question.context,
      choices: question.choices,
    })),
  ];

  for (const generated of generatedQuestions) {
    const recentQuestion: RecentQuestion = {
      topic: generated.topic,
      competency: generated.competency,
      prompt: generated.prompt,
      context: generated.context,
      choices: generated.choices,
    };

    if (seenQuestions.some((previous) => areSimilarQuestions(previous, recentQuestion))) continue;

    seenQuestions.unshift(recentQuestion);
    uniqueQuestions.push(toQuestion(generated, options, uniqueQuestions.length));
    if (uniqueQuestions.length === QUESTION_BATCH_SIZE) break;
  }

  if (uniqueQuestions.length === 0) {
    throw new Error('Gemini nu a generat întrebări suficient de diferite. Încearcă din nou.');
  }

  const updatedQueue = [...queuedQuestions, ...uniqueQuestions];
  questionQueues.set(storageKey, updatedQueue);
  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedQueue));
}

function startQuestionBatchRequest(
  options: GenerateQuestionOptions,
  apiKey: string,
  storageKey: string
): Promise<void> {
  let pendingRequest = pendingBatchRequests.get(storageKey);
  if (!pendingRequest) {
    pendingRequest = createQuestionBatch(options, apiKey, storageKey).finally(() => {
      if (pendingBatchRequests.get(storageKey) === pendingRequest) {
        pendingBatchRequests.delete(storageKey);
      }
    });
    pendingBatchRequests.set(storageKey, pendingRequest);
  }
  return pendingRequest;
}

async function ensureQuestionBatch(
  options: GenerateQuestionOptions,
  apiKey: string,
  storageKey: string
): Promise<void> {
  if (!questionQueues.has(storageKey)) {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      questionQueues.set(
        storageKey,
        Array.isArray(parsed) ? parsed.filter((item) => isStoredQuestion(item, options)) : []
      );
    } catch (error) {
      console.warn('Could not load saved Gemini question batch:', error);
      questionQueues.set(storageKey, []);
    }
  }

  if (questionQueues.get(storageKey)?.length) return;

  await startQuestionBatchRequest(options, apiKey, storageKey);
}

export async function generateQuestionWithGemini(
  options: GenerateQuestionOptions,
  apiKey?: string
): Promise<Question> {
  const normalizedKey = apiKey?.trim();
  if (!normalizedKey) {
    throw new Error('Cheia API Gemini lipsește.');
  }

  const storageKey = queueStorageKey(options);

  while (true) {
    await ensureQuestionBatch(options, normalizedKey, storageKey);
    const queue = questionQueues.get(storageKey) ?? [];
    const question = queue.shift();
    if (!question) continue;

    questionQueues.set(storageKey, queue);
    const recentQuestion: RecentQuestion = {
      topic: question.topic,
      competency: question.competency,
      prompt: question.prompt,
      context: question.context,
      choices: question.choices,
    };
    await Promise.all([
      AsyncStorage.setItem(storageKey, JSON.stringify(queue)),
      saveQuestionHistory(options.subject, recentQuestion),
    ]);
    if (queue.length > 0 && queue.length <= 2) {
      void startQuestionBatchRequest(options, normalizedKey, storageKey).catch((error) =>
        console.warn('Could not prefetch the next Gemini question batch:', error)
      );
    }
    return question;
  }
}
