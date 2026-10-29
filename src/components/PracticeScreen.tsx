import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { generateQuestionWithGemini } from '../services/geminiGeneratorService';
import { DifficultyLevel, GradeLevel, Question, SolvedQuestion, Subject } from '../types';
import { QuestionCard } from './QuestionCard';

type PracticeScreenProps = {
  subject: Subject;
  onBackToMenu: () => void;
  onQuestionSolved: (userIndex: number, isCorrect: boolean) => void;
  onAskMouse: (q: Question, autoRead: boolean) => void;
  onViewResults: (history: SolvedQuestion[]) => void;
  apiKey?: string;
};

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  subject,
  onBackToMenu,
  onQuestionSolved,
  onAskMouse,
  onViewResults,
  apiKey,
}) => {
  const grade: GradeLevel = 'Clasa VIII';
  const difficulty: DifficultyLevel = 'Mediu';
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [solvedHistory, setSolvedHistory] = useState<SolvedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [generatedCount, setGeneratedCount] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const fetchNewQuestion = async () => {
    setIsLoading(true);
    setGenerationError(null);
    try {
      const q = await generateQuestionWithGemini(
        {
          subject,
          grade,
          difficulty,
        },
        apiKey
      );
      setCurrentQuestion(q);
      setGeneratedCount((prev) => prev + 1);
    } catch (err) {
      console.error('Error generating question:', err);
      setGenerationError(
        err instanceof Error ? err.message : 'Verifică conexiunea la internet și cheia Gemini.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSolvedHistory([]);
    setGeneratedCount(0);
    fetchNewQuestion();
  }, [subject]);

  const handleAnswerSelected = (userIndex: number, isCorrect: boolean) => {
    if (currentQuestion) {
      const solvedItem: SolvedQuestion = {
        question: currentQuestion,
        userAnswerIndex: userIndex,
        isCorrect,
        timestamp: new Date(),
      };
      setSolvedHistory((prev) => [...prev, solvedItem]);
    }
    onQuestionSolved(userIndex, isCorrect);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" onPress={onBackToMenu} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Meniu</Text>
          </Pressable>

          <View style={styles.titleBox}>
            <Text style={styles.subjectTag}>
              {subject === 'romana' ? '📖 LIMBA ROMÂNĂ' : '📐 MATEMATICĂ'}
            </Text>
            <Text style={styles.subTitle}>Generator Nelimitat 2026</Text>
          </View>

          {solvedHistory.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onViewResults(solvedHistory)}
              style={styles.resultsBadgeBtn}
            >
              <Text style={styles.resultsBadgeIcon}>📊</Text>
              <Text style={styles.resultsBadgeText}>Raport ({solvedHistory.length})</Text>
            </Pressable>
          ) : (
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>#{generatedCount}</Text>
            </View>
          )}
        </View>

        {/* Question Loading / Display Area */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingEmoji}>🐭 ⚡</Text>
            <Text style={styles.loadingTitle}>Șoricelul Înțelept răsfoiește programa 2026...</Text>
            <Text style={styles.loadingSub}>
              Gemini AI generează un exercițiu nou conform Programei Oficiale de Evaluare Națională ({subject === 'romana' ? 'DOOM3' : 'Algebră & Geometrie'}).
            </Text>
          </View>
        ) : generationError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Nu s-a putut genera întrebarea</Text>
            <Text style={styles.errorText}>{generationError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={fetchNewQuestion}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Încearcă din nou</Text>
            </Pressable>
          </View>
        ) : currentQuestion ? (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            currentIndex={generatedCount - 1}
            onAnswerSelected={handleAnswerSelected}
            onAskMouse={(q) => onAskMouse(q, false)}
            onReadAloud={(q) => onAskMouse(q, true)}
            onViewResults={() => onViewResults(solvedHistory)}
          />
        ) : null}

        <Text style={styles.footerNote}>
          Atelier de Învățare • Programa Oficială Evaluarea Națională 2026 • Șoricelul Înțelept Live 🐭
        </Text>
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Generează întrebare nouă"
        disabled={isLoading}
        onPress={fetchNewQuestion}
        style={({ pressed }) => [
          styles.stickyGenerateButton,
          pressed && !isLoading && styles.stickyGenerateButtonPressed,
          isLoading && styles.stickyGenerateButtonDisabled,
        ]}
      >
        <Text style={styles.stickyGenerateIcon}>⚡</Text>
        <Text style={styles.stickyGenerateText}>
          {isLoading ? 'Se generează întrebarea...' : 'Generează întrebare nouă'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4ED',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 170,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#EAE7DE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#174D43',
    fontWeight: '800',
    fontSize: 12,
  },
  titleBox: {
    alignItems: 'center',
  },
  subjectTag: {
    color: '#174D43',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subTitle: {
    color: '#656A61',
    fontSize: 10,
    fontWeight: '600',
  },
  resultsBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#174D43',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  resultsBadgeIcon: {
    fontSize: 11,
  },
  resultsBadgeText: {
    color: '#F6D97A',
    fontWeight: '800',
    fontSize: 11,
  },
  counterBadge: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6D97A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  counterBadgeText: {
    color: '#174D43',
    fontWeight: '900',
    fontSize: 12,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginVertical: 16,
  },
  loadingEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#174D43',
    textAlign: 'center',
    marginBottom: 6,
  },
  loadingSub: {
    fontSize: 12,
    color: '#656A61',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FFF4F1',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8B3A7',
    marginVertical: 16,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9B3929',
    textAlign: 'center',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#6E362D',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#174D43',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  stickyGenerateButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 86,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#174D43',
    borderColor: '#F6D97A',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 6,
    shadowColor: '#174D43',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  stickyGenerateButtonPressed: {
    opacity: 0.88,
  },
  stickyGenerateButtonDisabled: {
    opacity: 0.72,
  },
  stickyGenerateIcon: {
    fontSize: 15,
  },
  stickyGenerateText: {
    color: '#F6D97A',
    fontSize: 14,
    fontWeight: '900',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8A8D85',
    lineHeight: 16,
    marginTop: 10,
  },
});
