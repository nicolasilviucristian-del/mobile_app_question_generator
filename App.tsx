import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GeminiLiveAgentModal } from './src/components/GeminiLiveAgentModal';
import { HomeScreen } from './src/components/HomeScreen';
import { PracticeScreen } from './src/components/PracticeScreen';
import { ResultsTabScreen } from './src/components/ResultsTabScreen';

import { Question, SolvedQuestion, Subject } from './src/types';

const DEFAULT_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'practice' | 'results'>('home');
  const [activeSubject, setActiveSubject] = useState<Subject>('romana');
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalGeneratedCount, setTotalGeneratedCount] = useState<number>(0);
  const [solvedHistoryForResults, setSolvedHistoryForResults] = useState<SolvedQuestion[]>([]);

  // Gemini API Key State — persistent via AsyncStorage
  const [apiKey, setApiKey] = useState<string>(DEFAULT_GEMINI_API_KEY);
  const [apiKeyDraft, setApiKeyDraft] = useState<string>('');

  // Load saved API key on app start
  useEffect(() => {
    AsyncStorage.getItem('gemini_api_key').then((saved) => {
      setApiKey(saved?.trim() || DEFAULT_GEMINI_API_KEY);
    });
  }, []);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // Mouse Live Agent State
  const [isLiveAgentVisible, setIsLiveAgentVisible] = useState<boolean>(false);
  const [autoReadOnOpen, setAutoReadOnOpen] = useState<boolean>(false);
  const [activeQuestionForAgent, setActiveQuestionForAgent] = useState<Question | undefined>(
    undefined
  );

  const handleSelectSubject = (subject: Subject) => {
    setActiveSubject(subject);
    setScreen('practice');
  };

  const handleQuestionSolved = (_userIndex: number, isCorrect: boolean) => {
    setTotalGeneratedCount((prev) => prev + 1);
    if (isCorrect) {
      setTotalScore((prev) => prev + 1);
    }
  };

  const handleViewResults = (history: SolvedQuestion[]) => {
    setSolvedHistoryForResults(history);
    setScreen('results');
  };

  const handleOpenMouseAgent = (q?: Question, readAloud: boolean = false) => {
    setActiveQuestionForAgent(q);
    setAutoReadOnOpen(readAloud);
    setIsLiveAgentVisible(true);
  };

  const handleAskMouseExplanation = (sq: SolvedQuestion) => {
    setActiveQuestionForAgent(sq.question);
    setAutoReadOnOpen(false);
    setIsLiveAgentVisible(true);
  };

  const handleOpenSettings = () => {
    setApiKeyDraft(apiKey);
    setShowApiKeyModal(true);
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKeyDraft.trim();
    setApiKey(trimmed || DEFAULT_GEMINI_API_KEY);
    if (trimmed.length > 0) {
      AsyncStorage.setItem('gemini_api_key', trimmed);
    } else {
      AsyncStorage.removeItem('gemini_api_key');
    }
    setShowApiKeyModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {screen === 'home' ? (
        <HomeScreen
          onSelectSubject={handleSelectSubject}
          totalScore={totalScore}
          totalGeneratedCount={totalGeneratedCount}
          onOpenSettings={handleOpenSettings}
          apiKeySet={apiKey.trim().length > 0}
        />
      ) : screen === 'practice' ? (
        <PracticeScreen
          subject={activeSubject}
          onBackToMenu={() => setScreen('home')}
          onQuestionSolved={handleQuestionSolved}
          onAskMouse={handleOpenMouseAgent}
          onViewResults={handleViewResults}
          apiKey={apiKey}
        />
      ) : (
        <ResultsTabScreen
          subject={activeSubject}
          solvedHistory={solvedHistoryForResults}
          onContinuePractice={() => setScreen('practice')}
          onBackToMenu={() => setScreen('home')}
          onAskMouseExplanation={handleAskMouseExplanation}
        />
      )}

      {/* Floating Action Button for Mouse Voice Tutor */}
      <Pressable
        accessibilityRole="button"
        onPress={() => handleOpenMouseAgent(activeQuestionForAgent, false)}
        style={({ pressed }) => [styles.fabMouse, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabIcon}>🐭</Text>
        <Text style={styles.fabText}>Chiț AI</Text>
      </Pressable>

      {/* Mouse Voice Agent Modal */}
      <GeminiLiveAgentModal
        visible={isLiveAgentVisible}
        onClose={() => setIsLiveAgentVisible(false)}
        currentQuestion={activeQuestionForAgent}
        autoReadOnOpen={autoReadOnOpen}
      />

      {/* API Key Setup Modal */}
      <Modal
        visible={showApiKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.apiKeyModal}>
            <View style={styles.apiKeyModalHeader}>
              <Text style={styles.apiKeyModalTitle}>🔑 Cheie API Gemini</Text>
              <Pressable onPress={() => setShowApiKeyModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.apiKeyDesc}>
              Introdu cheia API Gemini pentru a activa generarea nelimitată de exerciții cu AI.{'\n\n'}
              Obții gratuit de la:{' '}
              <Text style={styles.apiKeyLink}>aistudio.google.com/app/apikey</Text>
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>API KEY</Text>
              <TextInput
                style={styles.apiKeyInput}
                value={apiKeyDraft}
                onChangeText={setApiKeyDraft}
                placeholder="AIza..."
                placeholderTextColor="#AAAA9D"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
                multiline={false}
              />
            </View>

            {apiKeyDraft.trim().length > 0 && (
              <View style={styles.keyPreviewBadge}>
                <Text style={styles.keyPreviewText}>
                  🔐 {apiKeyDraft.trim().slice(0, 8)}...{apiKeyDraft.trim().slice(-4)}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleSaveApiKey}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
            >
              <Text style={styles.saveBtnText}>
                {apiKeyDraft.trim().length > 0 ? '✓ Salvează & Activează AI' : 'Folosește cheia inclusă'}
              </Text>
            </Pressable>

            {apiKey.trim().length > 0 && (
              <Pressable
                onPress={() => {
                  setApiKey(DEFAULT_GEMINI_API_KEY);
                  setApiKeyDraft('');
                  AsyncStorage.removeItem('gemini_api_key');
                  setShowApiKeyModal(false);
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>↺ Revino la cheia inclusă</Text>
              </Pressable>
            )}

            <Text style={styles.apiKeyFootnote}>
              Cheia inclusă în aplicație poate fi extrasă din APK. Folosește o cheie restricționată și monitorizează-i utilizarea.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4ED',
  },
  fabMouse: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#174D43',
    borderWidth: 2,
    borderColor: '#F6D97A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    gap: 8,
    elevation: 6,
    shadowColor: '#174D43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  fabIcon: {
    fontSize: 20,
  },
  fabText: {
    color: '#F6D97A',
    fontWeight: '900',
    fontSize: 14,
  },
  // API Key Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  apiKeyModal: {
    backgroundColor: '#F6F4ED',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  apiKeyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  apiKeyModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#174D43',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAE7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#174D43',
  },
  apiKeyDesc: {
    fontSize: 13,
    color: '#555A52',
    lineHeight: 20,
    marginBottom: 20,
  },
  apiKeyLink: {
    color: '#174D43',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#77776C',
    letterSpacing: 1,
    marginBottom: 6,
  },
  apiKeyInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#174D43',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2925',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  keyPreviewBadge: {
    backgroundColor: '#EAF4EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  keyPreviewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#174D43',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  saveBtn: {
    height: 50,
    backgroundColor: '#174D43',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    color: '#F6D97A',
    fontWeight: '900',
    fontSize: 14,
  },
  clearBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D97965',
    marginBottom: 14,
  },
  clearBtnText: {
    color: '#C85B47',
    fontWeight: '800',
    fontSize: 13,
  },
  apiKeyFootnote: {
    fontSize: 11,
    color: '#8A8D85',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});
