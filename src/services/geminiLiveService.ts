import * as Speech from 'expo-speech';
import type { AudioPlayer, AudioStream, AudioStreamBuffer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { ChatMessage, GeminiConnectionStatus, Question } from '../types';

type GeminiLiveCallbacks = {
  onStatusChange: (status: GeminiConnectionStatus) => void;
  onMessageReceived: (message: ChatMessage) => void;
  onMessageUpdated: (message: ChatMessage) => void;
  onError: (errorMsg: string) => void;
};

const GEMINI_LIVE_WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export class GeminiLiveAgent {
  private ws: WebSocket | null = null;
  private apiKey: string = '';
  private status: GeminiConnectionStatus = 'disconnected';
  private callbacks: GeminiLiveCallbacks;
  private currentInputTranscription: string = '';
  private currentTurnText: string = '';
  private currentTurnMessageId: string | null = null;
  private currentTurnAudio: Uint8Array[] = [];
  private audioPlayer: AudioPlayer | null = null;
  private isVoiceStreamActive: boolean = false;
  private responseAudioFile: File | null = null;
  private responseAudioUrl: string | null = null;

  constructor(callbacks: GeminiLiveCallbacks, apiKey?: string) {
    this.callbacks = callbacks;
    if (apiKey) this.apiKey = apiKey.trim();
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public getStatus(): GeminiConnectionStatus {
    return this.status;
  }

  public setAudioPlayer(player: AudioPlayer) {
    this.audioPlayer = player;
  }

  private updateStatus(newStatus: GeminiConnectionStatus) {
    this.status = newStatus;
    this.callbacks.onStatusChange(newStatus);
  }

  public async connect(questionContext?: Question) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus('connecting');

    try {
      if (!this.apiKey) {
        setTimeout(() => {
          this.updateStatus('connected');
          const welcomeMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            text: 'Mod demo: pentru răspunsuri AI și conversație vocală, adaugă cheia Gemini API din setări.',
            timestamp: new Date(),
          };
          this.callbacks.onMessageReceived(welcomeMsg);
        }, 600);
        return;
      }

      const wsUrl = `${GEMINI_LIVE_WS_BASE}?key=${encodeURIComponent(this.apiKey)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.sendSetupHandshake(questionContext);
      };

      this.ws.onmessage = (event) => {
        this.handleServerFrame(event.data);
      };

      this.ws.onerror = (evt: any) => {
        console.error('Gemini WS Error:', evt);
        this.updateStatus('error');
        this.callbacks.onError('Eroare de conexiune la Gemini Live API. Verifică cheia ta API.');
      };

      this.ws.onclose = () => {
        this.updateStatus('disconnected');
      };
    } catch (err: any) {
      console.error('Connection exception:', err);
      this.updateStatus('error');
      this.callbacks.onError(err.message || 'Nu s-a putut iniția conexiunea.');
    }
  }

  private sendSetupHandshake(questionContext?: Question) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    let systemContext =
      'Ești Șoricelul Înțelept, meditator pentru elevii de gimnaziu. TOATE RĂSPUNSURILE SCRISE ȘI ROSTITE TREBUIE SĂ FIE ÎNTOTDEAUNA ȘI EXCLUSIV ÎN LIMBA ROMÂNĂ, cu pronunție românească. Înțelege întrebarea utilizatorului și răspunde direct la ea. Nu repeta replici generice și nu spune „citește atent enunțul” decât dacă utilizatorul cere explicit un sfat general de rezolvare. Pentru exercițiul curent, folosește enunțul, variantele, răspunsul corect și explicația furnizate mai jos. Explică pe înțelesul elevului, pas cu pas când ți se cere, și oferă indicii fără a dezvălui răspunsul dacă ți se cere un indiciu. Păstrează răspunsurile clare și concise.';

    if (questionContext) {
      systemContext += `\nÎn acest moment elevul lucrează la întrebarea de [${questionContext.subject.toUpperCase()} - ${questionContext.grade}]: "${questionContext.prompt}". Variante: ${questionContext.choices.join(
        ', '
      )}. Răspuns corect: ${questionContext.choices[questionContext.answer]}. Explicație: ${questionContext.explanation}.`;
    }

    const setupPayload = {
      setup: {
        model: 'models/gemini-3.8-live',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Kore',
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemContext }],
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    };

    this.ws.send(JSON.stringify(setupPayload));
  }

  public sendTextMessage(text: string, currentQuestion?: Question) {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    this.callbacks.onMessageReceived(userMsg);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.updateStatus('listening');
      this.currentInputTranscription = '';
      this.currentTurnText = '';
      this.currentTurnMessageId = null;
      this.currentTurnAudio = [];
      this.ws.send(JSON.stringify({ realtimeInput: { text: text.trim() } }));
    } else {
      this.updateStatus('speaking');
      setTimeout(() => {
        let aiReply = this.generateMouseReply(text, currentQuestion);
        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          text: aiReply,
          timestamp: new Date(),
        };
        this.callbacks.onMessageReceived(aiMsg);
        this.updateStatus(this.isVoiceStreamActive ? 'listening' : 'connected');
      }, 500);
    }
  }

  public async startVoiceChat(stream: AudioStream): Promise<boolean> {
    if (!this.apiKey || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.callbacks.onError('Conectează cheia Gemini API înainte să pornești conversația vocală.');
      return false;
    }

    try {
      await stream.start();
      this.isVoiceStreamActive = true;
      this.updateStatus('listening');
      return true;
    } catch (err) {
      this.callbacks.onError(err instanceof Error ? err.message : 'Nu s-a putut porni microfonul.');
      return false;
    }
  }

  public stopVoiceChat(stream: AudioStream) {
    stream.stop();
    this.isVoiceStreamActive = false;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
    }
    if (this.status === 'listening') this.updateStatus('connected');
  }

  public sendAudioBuffer(buffer: AudioStreamBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const encodedAudio = this.encodeBase64(new Uint8Array(buffer.data));
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            data: encodedAudio,
            mimeType: `audio/pcm;rate=${buffer.sampleRate}`,
          },
        },
      })
    );
  }

  public readQuestionAloud(question: Question) {
    let speechScript = `Chiț-chiț! 🐭 Ascultă exercițiul de ${question.subject === 'romana' ? 'Limba Română' : 'Matematică'}, ${question.grade}. `;
    if (question.context) {
      speechScript += `Textul de suport spune așa: ${question.context}. `;
    }
    speechScript += `Întrebarea este: ${question.prompt}. Opțiunea A: ${question.choices[0]}. Opțiunea B: ${question.choices[1]}. Opțiunea C: ${question.choices[2]}. Opțiunea D: ${question.choices[3]}. Care crezi că este răspunsul corect? Chiț!`;

    const aiMsg: ChatMessage = {
      id: `msg-read-${Date.now()}`,
      role: 'assistant',
      text: `🐭 🔊 Îți citesc întrebarea: „${question.prompt}”`,
      timestamp: new Date(),
    };
    this.callbacks.onMessageReceived(aiMsg);
    this.speakMouse(speechScript);
  }

  private handleServerFrame(data: any) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());

      if (parsed.setupComplete) {
        this.updateStatus(this.isVoiceStreamActive ? 'listening' : 'connected');
        return;
      }

      let assistantTextChanged = false;
      if (parsed.serverContent?.modelTurn?.parts) {
        this.updateStatus('speaking');
        for (const part of parsed.serverContent.modelTurn.parts) {
          if (part.text) {
            this.currentTurnText += part.text;
            assistantTextChanged = true;
          }
          if (part.inlineData?.data) {
            this.currentTurnAudio.push(this.decodeBase64(part.inlineData.data));
          }
        }
      }

      if (parsed.serverContent?.outputTranscription?.text) {
        this.currentTurnText += parsed.serverContent.outputTranscription.text;
        assistantTextChanged = true;
      }
      if (parsed.serverContent?.inputTranscription?.text) {
        this.currentInputTranscription += parsed.serverContent.inputTranscription.text;
      }
      if (assistantTextChanged) this.publishAssistantMessage();

      if (parsed.serverContent?.turnComplete) {
        if (this.currentInputTranscription.trim()) {
          this.callbacks.onMessageReceived({
            id: `msg-user-${Date.now()}`,
            role: 'user',
            text: this.currentInputTranscription.trim(),
            timestamp: new Date(),
          });
        }
        this.publishAssistantMessage();
        if (this.currentTurnAudio.length > 0 && this.audioPlayer) {
          void this.playAudioResponse(this.currentTurnAudio);
        }
        this.currentTurnText = '';
        this.currentTurnMessageId = null;
        this.currentInputTranscription = '';
        this.currentTurnAudio = [];
        this.updateStatus(this.isVoiceStreamActive ? 'listening' : 'connected');
      }
    } catch (err) {
      console.error('Error parsing Gemini WS frame:', err);
    }
  }

  private publishAssistantMessage() {
    const text = this.currentTurnText.trim();
    if (!text) return;

    const isUpdate = this.currentTurnMessageId !== null;
    const message: ChatMessage = {
      id: this.currentTurnMessageId ?? `msg-ai-${Date.now()}`,
      role: 'assistant',
      text,
      timestamp: new Date(),
    };
    this.currentTurnMessageId = message.id;
    if (isUpdate) {
      this.callbacks.onMessageUpdated(message);
    } else {
      this.callbacks.onMessageReceived(message);
    }
  }

  private encodeBase64(bytes: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let encoded = '';
    for (let index = 0; index < bytes.length; index += 3) {
      const first = bytes[index];
      const second = bytes[index + 1];
      const third = bytes[index + 2];
      encoded += alphabet[first >> 2];
      encoded += alphabet[((first & 3) << 4) | ((second ?? 0) >> 4)];
      encoded += second === undefined ? '=' : alphabet[((second & 15) << 2) | ((third ?? 0) >> 6)];
      encoded += third === undefined ? '=' : alphabet[third & 63];
    }
    return encoded;
  }

  private decodeBase64(encoded: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const clean = encoded.replace(/[^A-Za-z0-9+/=]/g, '');
    const bytes = new Uint8Array(Math.ceil((clean.length * 3) / 4));
    let byteIndex = 0;
    for (let index = 0; index < clean.length; index += 4) {
      const first = alphabet.indexOf(clean[index]);
      const second = alphabet.indexOf(clean[index + 1]);
      const third = alphabet.indexOf(clean[index + 2]);
      const fourth = alphabet.indexOf(clean[index + 3]);
      bytes[byteIndex++] = (first << 2) | (second >> 4);
      if (clean[index + 2] !== '=') bytes[byteIndex++] = ((second & 15) << 4) | (third >> 2);
      if (clean[index + 3] !== '=') bytes[byteIndex++] = ((third & 3) << 6) | fourth;
    }
    return bytes.subarray(0, byteIndex);
  }

  private createWavBytes(chunks: Uint8Array[]): Uint8Array {
    const audioLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const wavBytes = new Uint8Array(44 + audioLength);
    const view = new DataView(wavBytes.buffer);
    const writeText = (offset: number, value: string) => {
      for (let index = 0; index < value.length; index += 1) {
        wavBytes[offset + index] = value.charCodeAt(index);
      }
    };

    writeText(0, 'RIFF');
    view.setUint32(4, 36 + audioLength, true);
    writeText(8, 'WAVE');
    writeText(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 24000, true);
    view.setUint32(28, 48000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, 'data');
    view.setUint32(40, audioLength, true);

    let offset = 44;
    for (const chunk of chunks) {
      wavBytes.set(chunk, offset);
      offset += chunk.length;
    }
    return wavBytes;
  }

  private async playAudioResponse(chunks: Uint8Array[]) {
    if (!this.audioPlayer) return;
    try {
      const wavBytes = this.createWavBytes(chunks);
      if (Platform.OS === 'web') {
        const audioBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.audioPlayer.replace({ uri: audioUrl });
        this.audioPlayer.play();
        if (this.responseAudioUrl) URL.revokeObjectURL(this.responseAudioUrl);
        this.responseAudioUrl = audioUrl;
        return;
      }

      const file = new File(Paths.cache, `gemini-response-${Date.now()}.wav`);
      file.create({ overwrite: true });
      file.write(wavBytes);
      this.audioPlayer.replace({ uri: file.uri });
      this.audioPlayer.play();
      this.responseAudioFile?.delete();
      this.responseAudioFile = file;
    } catch (err) {
      this.callbacks.onError(err instanceof Error ? err.message : 'Nu s-a putut reda răspunsul audio.');
    }
  }

  /**
   * Speaks text using a high-pitched, enthusiastic Mouse Voice!
   * Pitch: 1.5 (Cute high pitch), Rate: 1.05 (Fast, agile mouse speech)
   */
  public speakMouse(text: string) {
    Speech.stop();
    void Speech.getAvailableVoicesAsync().then((voices) => {
      const romanianVoice = voices.find((voice) => /^ro([-_]|$)/i.test(voice.language));
      if (!romanianVoice) {
        this.callbacks.onError('Nu este instalată o voce românească. Instalează vocea română în setările text-to-speech ale dispozitivului.');
        return;
      }
      Speech.speak(text, {
        language: romanianVoice.language,
        voice: romanianVoice.identifier,
        pitch: 1.1,
        rate: 0.92,
      });
    }).catch(() => {
      this.callbacks.onError('Nu s-au putut încărca vocile text-to-speech ale dispozitivului.');
    });
  }

  public stopSpeech() {
    try {
      Speech.stop();
      this.audioPlayer?.pause();
    } catch {}
  }

  public disconnect() {
    this.stopSpeech();
    if (this.ws) {
      try {
        this.ws.close();
        } catch {}
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }

  private generateMouseReply(userText: string, question?: Question): string {
    const lower = userText.toLowerCase();

    if (lower.includes('indiciu') || lower.includes('ajutor')) {
      if (question?.hint) {
        return `Chiț-chiț! 🐭 Am ros puțin din secretul acestei probleme: ${question.hint}`;
      }
      return 'În modul demo nu pot analiza exercițiul. Adaugă cheia Gemini API din setări pentru un indiciu personalizat.';
    }

    if (lower.includes('explic') || lower.includes('de ce') || lower.includes('cum')) {
      if (question) {
        return `Chiț-chiț! 🐭 Pentru întrebarea „${question.prompt}”, răspunsul se calculează așa: ${question.explanation}`;
      }
      return 'În modul demo nu pot genera o explicație nouă. Adaugă cheia Gemini API din setări pentru răspunsuri adaptate întrebării tale.';
    }

    if (lower.includes('citește') || lower.includes('citeste')) {
      if (question) {
        return `Chiț-chiț! Îți citesc imediat întrebarea: „${question.prompt}”. Alege varianta corectă!`;
      }
    }

    if (lower.includes('salut') || lower.includes('buna') || lower.includes('buna ziua')) {
      return 'Chiț-chiț! Salutare! Sunt Șoricelul Înțelept 🐭. Cu ce exercițiu de la Evaluarea Națională te pot ajuta acum?';
    }

    return 'Pentru a răspunde la întrebări noi și a conversa vocal, conectează o cheie Gemini API din setări.';
  }
}
