import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SolvedQuestion, Subject } from '../types';

type ResultsTabScreenProps = {
  subject: Subject;
  solvedHistory: SolvedQuestion[];
  onContinuePractice: () => void;
  onBackToMenu: () => void;
  onAskMouseExplanation: (sq: SolvedQuestion) => void;
};

export const ResultsTabScreen: React.FC<ResultsTabScreenProps> = ({
  subject,
  solvedHistory,
  onContinuePractice,
  onBackToMenu,
  onAskMouseExplanation,
}) => {
  const correctCount = solvedHistory.filter((item) => item.isCorrect).length;
  const totalCount = solvedHistory.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const subjectName = subject === 'romana' ? 'Limba și Literatura Română' : 'Matematică';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={onBackToMenu} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Meniu Principal</Text>
        </Pressable>

        <Text style={styles.headerTitle}>RAPORT DETALIAT 📊</Text>

        <Pressable accessibilityRole="button" onPress={onContinuePractice} style={styles.continueHeaderBtn}>
          <Text style={styles.continueHeaderBtnText}>+ Exerciții</Text>
        </Pressable>
      </View>

      {/* Main Score Summary Banner */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreEyebrow}>REZULTATE SESIUNE AI • {subjectName.toUpperCase()}</Text>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={styles.scoreSub}>
          Ai răspuns corect la {correctCount} din {totalCount} exerciții rezolvate
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>

        <Text style={styles.feedbackMsg}>
          {percentage >= 80
            ? '🎉 Excelent! Stăpânești foarte bine materia din Programa Oficială 2026!'
            : percentage >= 50
            ? '👍 Rezultat bun! Vezi mai jos explicațiile detaliate pentru exercițiile greșite.'
            : '💪 Continuă să exersezi! Verifică explicațiile pas cu pas de mai jos ale Șoricelului Înțelept.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        TOATE EXERCIȚIILE REZOLVATE ({solvedHistory.length})
      </Text>

      {solvedHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nu există exerciții în această sesiune</Text>
          <Text style={styles.emptySub}>
            Rezolvă mai întâi câteva exerciții pentru a vedea raportul detaliat de barem.
          </Text>
        </View>
      ) : (
        solvedHistory.map((item, index) => {
          const { question, userAnswerIndex, isCorrect } = item;
          const userChoiceLetter = String.fromCharCode(65 + userAnswerIndex);
          const correctChoiceLetter = String.fromCharCode(65 + question.answer);

          return (
            <View
              key={`review-${question.id}-${index}`}
              style={[
                styles.reviewCard,
                isCorrect ? styles.reviewCardCorrect : styles.reviewCardIncorrect,
              ]}
            >
              {/* Question Header Metadata */}
              <View style={styles.cardTopRow}>
                <View style={styles.badgeRow}>
                  <View style={isCorrect ? styles.badgeCorrect : styles.badgeIncorrect}>
                    <Text style={styles.badgeStatusText}>
                      {isCorrect ? '✓ Corect (+5 pct)' : '❌ Greșit (0 pct)'}
                    </Text>
                  </View>

                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{question.grade}</Text>
                  </View>

                  <Text style={styles.topicBadgeText}>{question.topic}</Text>
                </View>

                <Text style={styles.itemIndexText}>#{index + 1}</Text>
              </View>

              {/* Context if available */}
              {question.context ? (
                <View style={styles.contextBox}>
                  <Text style={styles.contextHeader}>TEXT SUPORT:</Text>
                  <Text style={styles.contextText}>{question.context}</Text>
                </View>
              ) : null}

              {/* Question Prompt */}
              <Text style={styles.promptText}>{question.prompt}</Text>

              {/* User Answer vs Correct Answer Box */}
              <View style={styles.answersComparisonBox}>
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Răspunsul tău:</Text>
                  <Text
                    style={[
                      styles.answerValue,
                      isCorrect ? styles.answerValueCorrect : styles.answerValueIncorrect,
                    ]}
                  >
                    ({userChoiceLetter}) {question.choices[userAnswerIndex]}
                  </Text>
                </View>

                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Răspuns corect:</Text>
                  <Text style={[styles.answerValue, styles.answerValueCorrect]}>
                    ({correctChoiceLetter}) {question.choices[question.answer]}
                  </Text>
                </View>
              </View>

              {/* Full Detailed Barem & Explanation */}
              <View style={styles.explanationBox}>
                <View style={styles.explanationHeaderRow}>
                  <Text style={styles.explanationTitle}>BAREM & EXPLICAȚIE PROGRAMA 2026:</Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onAskMouseExplanation(item)}
                    style={styles.mouseAudioBtn}
                  >
                    <Text style={styles.mouseAudioBtnIcon}>🐭 🔊</Text>
                    <Text style={styles.mouseAudioBtnText}>Șoricelul citește</Text>
                  </Pressable>
                </View>

                <Text style={styles.explanationText}>{question.explanation}</Text>
              </View>
            </View>
          );
        })
      )}

      {/* Footer Actions */}
      <View style={styles.footerActions}>
        <Pressable
          accessibilityRole="button"
          onPress={onContinuePractice}
          style={({ pressed }) => [styles.continueBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.continueBtnText}>⚡ Generează Alt Exercițiu AI 2026</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onBackToMenu}
          style={({ pressed }) => [styles.homeBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.homeBtnText}>🏠 Înapoi la Meniul Principal</Text>
        </Pressable>
      </View>

      <Text style={styles.footerNote}>
        Atelier de Învățare • Raport Examen Evaluarea Națională 2026 • Șoricelul Înțelept Live 🐭
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4ED',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 95,
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
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#174D43',
    letterSpacing: 0.8,
  },
  continueHeaderBtn: {
    backgroundColor: '#174D43',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  continueHeaderBtnText: {
    color: '#F6D97A',
    fontWeight: '800',
    fontSize: 11,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D45F47',
    letterSpacing: 1,
    marginBottom: 4,
  },
  percentageText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#174D43',
  },
  scoreSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555A52',
    marginTop: 2,
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: '#EAE7DE',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#174D43',
    borderRadius: 6,
  },
  feedbackMsg: {
    fontSize: 13,
    color: '#2C332E',
    lineHeight: 19,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#77776C',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#174D43',
  },
  emptySub: {
    fontSize: 12,
    color: '#656A61',
    textAlign: 'center',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 16,
  },
  reviewCardCorrect: {
    borderLeftWidth: 5,
    borderLeftColor: '#348064',
  },
  reviewCardIncorrect: {
    borderLeftWidth: 5,
    borderLeftColor: '#D97965',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgeCorrect: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeIncorrect: {
    backgroundColor: '#FDF0ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeStatusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2C332E',
  },
  gradeBadge: {
    backgroundColor: '#D45F47',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gradeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#174D43',
  },
  itemIndexText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#174D43',
  },
  contextBox: {
    backgroundColor: '#F7F6F0',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F6D97A',
    marginBottom: 10,
  },
  contextHeader: {
    fontSize: 8,
    fontWeight: '800',
    color: '#857850',
    letterSpacing: 0.8,
  },
  contextText: {
    fontSize: 12,
    color: '#444841',
    fontStyle: 'italic',
    marginTop: 2,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2925',
    lineHeight: 21,
    marginBottom: 12,
  },
  answersComparisonBox: {
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 10,
    gap: 6,
  },
  answerRow: {
    flexDirection: 'column',
    gap: 2,
  },
  answerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#77776C',
  },
  answerValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  answerValueCorrect: {
    color: '#348064',
  },
  answerValueIncorrect: {
    color: '#C85B47',
  },
  explanationBox: {
    backgroundColor: '#F8F6F0',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAE7DE',
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#77776C',
    letterSpacing: 0.8,
  },
  mouseAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6D97A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  mouseAudioBtnIcon: {
    fontSize: 10,
  },
  mouseAudioBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#174D43',
  },
  explanationText: {
    fontSize: 12,
    color: '#4A5048',
    lineHeight: 18,
  },
  footerActions: {
    marginTop: 10,
    gap: 10,
  },
  continueBtn: {
    height: 48,
    backgroundColor: '#174D43',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#F6D97A',
    fontWeight: '900',
    fontSize: 14,
  },
  homeBtn: {
    height: 46,
    backgroundColor: '#EAE7DE',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {
    color: '#174D43',
    fontWeight: '800',
    fontSize: 13,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8A8D85',
    lineHeight: 16,
    marginTop: 14,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
