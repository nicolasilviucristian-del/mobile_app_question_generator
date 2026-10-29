import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AudioModule, setAudioModeAsync, useAudioPlayer, useAudioStream } from 'expo-audio';
import { GeminiLiveAgent } from '../services/geminiLiveService';
import { ChatMessage, GeminiConnectionStatus, Question } from '../types';
import { MouseAvatar } from './MouseAvatar';

type GeminiLiveAgentModalProps = {
  visible: boolean;
  onClose: () => void;
  currentQuestion?: Question;
  autoReadOnOpen?: boolean;
};

export const GeminiLiveAgentModal: React.FC<GeminiLiveAgentModalProps> = ({
  visible,
  onClose,
  currentQuestion,
  autoReadOnOpen = false,
}) => {
  const [status, setStatus] = useState<GeminiConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const agentRef = useRef<GeminiLiveAgent | null>(null);
  const voiceChatActiveRef = useRef(false);
  const audioPlayer = useAudioPlayer(null);
  const audioStream = useAudioStream({
    channels: 1,
    sampleRate: 16000,
    encoding: 'int16',
    onBuffer: (buffer) => agentRef.current?.sendAudioBuffer(buffer),
  });

  useEffect(() => {
    agentRef.current = new GeminiLiveAgent(
      {
        onStatusChange: (newStatus) => {
          setStatus(newStatus);
          if ((newStatus === 'error' || newStatus === 'disconnected') && voiceChatActiveRef.current) {
            audioStream.stream.stop();
            voiceChatActiveRef.current = false;
            setIsVoiceChatActive(false);
          }
        },
        onMessageReceived: (newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
        },
        onMessageUpdated: (updatedMsg) => {
          setMessages((prev) => prev.map((message) =>
            message.id === updatedMsg.id ? updatedMsg : message
          ));
        },
        onError: (err) => {
          setErrorMsg(err);
        },
      },
    );
    agentRef.current.setAudioPlayer(audioPlayer);

    return () => {
      if (voiceChatActiveRef.current) audioStream.stream.stop();
      agentRef.current?.disconnect();
    };
  }, [audioPlayer, audioStream.stream]);

  useEffect(() => {
    if (visible) {
      agentRef.current?.connect(currentQuestion);

      if (autoReadOnOpen && currentQuestion) {
        setTimeout(() => {
          agentRef.current?.readQuestionAloud(currentQuestion);
        }, 800);
      }
    } else {
      if (voiceChatActiveRef.current) {
        agentRef.current?.stopVoiceChat(audioStream.stream);
        voiceChatActiveRef.current = false;
        setIsVoiceChatActive(false);
      }
      agentRef.current?.stopSpeech();
    }
  }, [visible, currentQuestion, autoReadOnOpen, audioStream.stream]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    agentRef.current?.sendTextMessage(textToSend, currentQuestion);
  };

  const handleToggleVoiceChat = async () => {
    if (voiceChatActiveRef.current) {
      agentRef.current?.stopVoiceChat(audioStream.stream);
      voiceChatActiveRef.current = false;
      setIsVoiceChatActive(false);
      return;
    }

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg('Permite accesul la microfon pentru conversația vocală.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const started = await agentRef.current?.startVoiceChat(audioStream.stream);
      if (started) {
        voiceChatActiveRef.current = true;
        setIsVoiceChatActive(true);
        setErrorMsg(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Nu s-a putut porni conversația vocală.');
    }
  };

  const handleQuickAction = (promptText: string) => {
    agentRef.current?.sendTextMessage(promptText, currentQuestion);
  };

  const handleReadAloud = () => {
    if (currentQuestion) {
      agentRef.current?.readQuestionAloud(currentQuestion);
    }
  };

  const handleSaveApiKey = () => {
    agentRef.current?.setApiKey(apiKeyInput);
    setShowConfig(false);
    setErrorMsg(null);
    agentRef.current?.connect(currentQuestion);
  };

  const handleClose = () => {
    setErrorMsg(null);
    onClose();
  };

  const mouseAvatarStatus: 'idle' | 'speaking' | 'listening' | 'reading' =
    status === 'speaking'
      ? 'speaking'
      : status === 'listening'
      ? 'listening'
      : 'idle';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>🐭</Text>
              <View>
                <Text style={styles.headerTitle}>Șoricelul Înțelept Live</Text>
                <Text style={styles.headerSubtitle}>
                  Chat vocal în timp real • Gemini Live
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowConfig(!showConfig)}
                style={styles.iconBtn}
              >
                <Text style={styles.iconBtnText}>⚙️</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleClose} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>

          {/* Connection Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.statusDot,
                  status === 'connected' && styles.dotConnected,
                  status === 'connecting' && styles.dotConnecting,
                  (status === 'speaking' || status === 'listening') && styles.dotActive,
                  status === 'error' && styles.dotError,
                ]}
              />
              <Text style={styles.statusText}>
                {status === 'connected'
                  ? 'Șoricelul este pregătit! Chiț!'
                  : status === 'connecting'
                  ? 'Șoricelul își pune ochelarii de citit...'
                  : status === 'speaking'
                  ? 'Șoricelul îți vorbește în română...'
                  : status === 'listening'
                  ? 'Șoricelul te ascultă cu atenție...'
                  : status === 'error'
                  ? 'Conexiune întreruptă'
                  : 'Deconectat'}
              </Text>
            </View>

            <Text style={styles.freeBadge}>Gemini Live • Română</Text>
          </View>

          {/* Config Drawer */}
          {showConfig ? (
            <View style={styles.configDrawer}>
              <Text style={styles.configTitle}>Configurare Cheie Gemini API</Text>
              <Text style={styles.configDesc}>
                Introdu cheia ta din Google AI Studio pentru răspunsuri Gemini și conversație vocală în timp real. Fără cheie, aplicația rulează doar în modul demo.
              </Text>

              <TextInput
                secureTextEntry
                placeholder="AIzaSy..."
                placeholderTextColor="#A0A59C"
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                style={styles.apiKeyInput}
              />

              <Pressable
                accessibilityRole="button"
                onPress={handleSaveApiKey}
                style={styles.saveKeyBtn}
              >
                <Text style={styles.saveKeyBtnText}>Salvează și Conectează</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Error Box */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* Animated Interactive Mouse Character Avatar */}
          <MouseAvatar
            status={mouseAvatarStatus}
            onPress={handleReadAloud}
            speechBubbleText={
              status === 'speaking'
                ? 'Chiț-chiț! Ascultă ce am de spus!'
                : status === 'listening'
                ? 'Chiț! Procesez răspunsul...'
                : 'Apasă pe mine să-ți citesc întrebarea!'
            }
          />

          {/* Active Question Context Bar */}
          {currentQuestion ? (
            <View style={styles.activeQuestionBar}>
              <Text style={styles.activeQuestionLabel}>EXERCIȚIUL CURENT (GIMNAZIU):</Text>
              <Text style={styles.activeQuestionPrompt} numberOfLines={2}>
                [{currentQuestion.subject.toUpperCase()} - {currentQuestion.grade}] {currentQuestion.prompt}
              </Text>
            </View>
          ) : null}

          {/* Quick Actions Presets */}
          <View style={styles.presetsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {currentQuestion ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleReadAloud}
                  style={styles.presetChipRead}
                >
                  <Text style={styles.presetChipReadText}>🔊 Citește-mi întrebarea</Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => handleQuickAction('Chiț! Dă-mi un indiciu la această problemă fără să-mi dai răspunsul direct.')}
                style={styles.presetChip}
              >
                <Text style={styles.presetChipText}>🧀 Dă-mi un indiciu</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => handleQuickAction('Chiț-chiț! Explică-mi pas cu pas cum se rezolvă corect exercițiul.')}
                style={styles.presetChip}
              >
                <Text style={styles.presetChipText}>✍️ Rezolvare pas cu pas</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => handleQuickAction('Explică-mi regula teoretică principală ca pentru un șoricel curios!')}
                style={styles.presetChip}
              >
                <Text style={styles.presetChipText}>📖 Explică teoria</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Conversation History Transcript */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptScroll}
            contentContainerStyle={styles.transcriptContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyTranscript}>
                <Text style={styles.emptyText}>
                  Chiț-chiț! Pune-mi orice întrebare despre examenul de capacitate sau apasă pe „Citește-mi întrebarea”!
                </Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text style={[styles.messageRole, msg.role === 'user' && styles.userMessageRole]}>
                    {msg.role === 'user' ? 'Tu' : 'Șoricelul Înțelept 🐭'}
                  </Text>
                  <Text style={[styles.messageText, msg.role === 'user' && styles.userMessageText]}>
                    {msg.text}
                  </Text>

                  {msg.role === 'assistant' ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => agentRef.current?.speakMouse(msg.text)}
                      style={styles.replayAudioBtn}
                    >
                      <Text style={styles.replayAudioText}>🔊 Ascultă în română</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>

          {/* Input Controls */}
          <View style={styles.inputBar}>
            <TextInput
              placeholder="Scrie-i o întrebare Șoricelului..."
              placeholderTextColor="#888E84"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendText}
              returnKeyType="send"
              blurOnSubmit={false}
              style={styles.textInput}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isVoiceChatActive ? 'Oprește conversația vocală' : 'Pornește conversația vocală'}
              onPress={handleToggleVoiceChat}
              style={({ pressed }) => [
                styles.voiceBtn,
                isVoiceChatActive && styles.voiceBtnActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.voiceBtnText}>{isVoiceChatActive ? '■' : '🎙'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleSendText}
              style={({ pressed }) => [styles.sendBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.sendBtnText}>Trimite</Text>
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 20, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '92%',
    maxHeight: '92%',
    backgroundColor: '#F6F4ED',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 26,
  },
  headerTitle: {
    color: '#174D43',
    fontWeight: '900',
    fontSize: 16,
  },
  headerSubtitle: {
    color: '#656A61',
    fontSize: 10,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAE7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 8,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888E84',
  },
  dotConnected: {
    backgroundColor: '#348064',
  },
  dotConnecting: {
    backgroundColor: '#F6D97A',
  },
  dotActive: {
    backgroundColor: '#4ECA77',
  },
  dotError: {
    backgroundColor: '#D97965',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3C423B',
  },
  freeBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#174D43',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  configDrawer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 10,
  },
  configTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#174D43',
    marginBottom: 4,
  },
  configDesc: {
    fontSize: 11,
    color: '#656A61',
    lineHeight: 15,
    marginBottom: 8,
  },
  apiKeyInput: {
    height: 40,
    backgroundColor: '#F7F6F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E3DFD5',
    fontSize: 12,
    color: '#222',
    marginBottom: 8,
  },
  saveKeyBtn: {
    height: 36,
    backgroundColor: '#174D43',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveKeyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#FDF0ED',
    borderWidth: 1,
    borderColor: '#D97965',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  errorText: {
    color: '#C85B47',
    fontSize: 11,
    fontWeight: '700',
  },
  activeQuestionBar: {
    backgroundColor: '#FFF9E5',
    borderWidth: 1,
    borderColor: '#F3E4B2',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  activeQuestionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8A6D19',
    letterSpacing: 0.8,
  },
  activeQuestionPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#443813',
    marginTop: 2,
  },
  presetsRow: {
    marginBottom: 8,
  },
  presetChipRead: {
    backgroundColor: '#174D43',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 6,
  },
  presetChipReadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F6D97A',
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3DFD5',
    marginRight: 6,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#174D43',
  },
  transcriptScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 10,
    marginBottom: 10,
  },
  transcriptContent: {
    gap: 8,
  },
  emptyTranscript: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888E84',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 14,
    maxWidth: '88%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#174D43',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4F2EA',
    borderWidth: 1,
    borderColor: '#E5E2D8',
  },
  messageRole: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
    color: '#888E84',
  },
  userMessageRole: {
    color: '#D4E8E0',
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#222',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  replayAudioBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6D97A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  replayAudioText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#174D43',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    fontSize: 13,
    color: '#222',
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8EEE9',
    borderWidth: 1,
    borderColor: '#D5DED7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: {
    backgroundColor: '#D97965',
    borderColor: '#D97965',
  },
  voiceBtnText: {
    color: '#174D43',
    fontWeight: '900',
    fontSize: 16,
  },
  sendBtn: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: '#174D43',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
