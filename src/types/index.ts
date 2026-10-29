export type Subject = 'romana' | 'matematica';

export type GradeLevel = 'Clasa V' | 'Clasa VI' | 'Clasa VII' | 'Clasa VIII';
export type GradeFilterOption = 'toate' | 'Clasa V' | 'Clasa VI' | 'Clasa VII' | 'Clasa VIII';

export type DifficultyLevel = 'Ușor' | 'Mediu' | 'Avansat';
export type ExamSection = 'Subiectul I' | 'Subiectul II' | 'Subiectul III';

export type Question = {
  id: string;
  subject: Subject;
  grade: GradeLevel;
  topic: string;
  prompt: string;
  context?: string;
  choices: string[];
  answer: number;
  explanation: string;
  hint?: string;
  // Official Evaluarea Națională 2026 Metadata
  difficulty?: DifficultyLevel;
  competency?: string;
  examSection?: ExamSection;
  points?: number;
  sourceSyllabus?: string;
  isAiGenerated?: boolean;
};

export type SolvedQuestion = {
  question: Question;
  userAnswerIndex: number;
  isCorrect: boolean;
  timestamp: Date;
};

export type GeminiConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  text: string;
  timestamp: Date;
  isAudioResponse?: boolean;
};

export type GenerateQuestionOptions = {
  subject: Subject;
  grade: GradeLevel;
  difficulty: DifficultyLevel;
  topic?: string;
};
