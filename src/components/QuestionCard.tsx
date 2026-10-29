import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Question } from '../types';

type QuestionCardProps = {
  question: Question;
  currentIndex: number;
  onAnswerSelected: (userIndex: number, isCorrect: boolean) => void;
  onAskMouse: (q: Question) => void;
  onReadAloud: (q: Question) => void;
  onViewResults: () => void;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  onAnswerSelected,
  onAskMouse,
  onReadAloud,
  onViewResults,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  React.useEffect(() => {
    setSelectedIndex(null);
    setShowHint(false);
  }, [question.id]);

  const handleChooseOption = (index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const isCorrect = index === question.answer;
    onAnswerSelected(index, isCorrect);
  };

  const isAnswered = selectedIndex !== null;

  return (
    <View style={styles.cardContainer}>
      {/* Official Exam Format Header */}
      <View style={styles.officialFormatBar}>
        <View style={styles.officialBadgeGroup}>
          <View style={styles.examSectionTag}>
            <Text style={styles.examSectionText}>{question.examSection || 'Subiectul I'}</Text>
          </View>

          <View style={styles.pointsTag}>
            <Text style={styles.pointsText}>{question.points || 5} Puncte</Text>
          </View>

          {question.competency ? (
            <View style={styles.competencyTag}>
              <Text style={styles.competencyText}>{question.competency}</Text>
            </View>
          ) : null}

        </View>
      </View>

      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <View style={styles.gradeTag}>
            <Text style={styles.gradeTagText}>{question.grade}</Text>
          </View>
          <Text style={styles.topicText}>{question.topic}</Text>
        </View>

        <Text style={styles.questionCounter}>Exercițiul #{currentIndex + 1}</Text>
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: '100%' }]} />
      </View>

      {/* Mouse Voice Reader Bar */}
      <View style={styles.mouseReaderRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onReadAloud(question)}
          style={({ pressed }) => [styles.mouseReadBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.mouseReadIcon}>🐭 🔊</Text>
          <Text style={styles.mouseReadText}>Șoricelul citește întrebarea cu voce tare</Text>
        </Pressable>
      </View>

      {question.context ? (
        <View style={styles.contextBox}>
          <Text style={styles.contextHeader}>TEXT / FRAGMENT DE SUPORT (PROGRAMA 2026):</Text>
          <Text style={styles.contextText}>{question.context}</Text>
        </View>
      ) : null}

      <Text style={styles.promptText}>{question.prompt}</Text>

      {question.hint && !isAnswered ? (
        <View style={styles.hintContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowHint(!showHint)}
            style={styles.hintBtn}
          >
            <Text style={styles.hintBtnText}>
              {showHint ? '🔒 Ascunde indiciul șoricelului' : '🧀 Vezi indiciul șoricelului'}
            </Text>
          </Pressable>
          {showHint ? <Text style={styles.hintContentText}>{question.hint}</Text> : null}
        </View>
      ) : null}

      <View style={styles.choicesList}>
        {question.choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = question.answer === index;
          const showSuccess = isAnswered && isCorrect;
          const showError = isSelected && !isCorrect;

          return (
            <Pressable
              key={`${question.id}-choice-${index}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnswered }}
              disabled={isAnswered}
              onPress={() => handleChooseOption(index)}
              style={[
                styles.choiceItem,
                showSuccess && styles.choiceItemCorrect,
                showError && styles.choiceItemIncorrect,
              ]}
            >
              <Text
                style={[
                  styles.choiceLetter,
                  showSuccess && styles.choiceLetterCorrect,
                  showError && styles.choiceLetterIncorrect,
                ]}
              >
                {String.fromCharCode(65 + index)}
              </Text>

              <Text style={styles.choiceText}>{choice}</Text>

              {showSuccess ? <Text style={styles.resultBadge}>✓</Text> : null}
              {showError ? <Text style={styles.resultBadgeErr}>×</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {isAnswered ? (
        <View style={styles.feedbackContainer}>
          <View style={styles.feedbackHeader}>
            <Text
              style={[
                styles.feedbackTitle,
                selectedIndex === question.answer
                  ? styles.feedbackTitleCorrect
                  : styles.feedbackTitleIncorrect,
              ]}
            >
              {selectedIndex === question.answer
                ? '🎉 Răspuns Corect! (+5 puncte)'
                : '❌ Răspuns Greșit. Vezi baremul de mai jos!'}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => onAskMouse(question)}
              style={styles.askMouseInlineBtn}
            >
              <Text style={styles.askMouseInlineIcon}>🐭</Text>
              <Text style={styles.askMouseInlineText}>Discută cu Șoricelul</Text>
            </Pressable>
          </View>

          <Text style={styles.explanationTitle}>BAREM ȘI EXPLICAȚIE PROGRAMA 2026:</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>

          {/* Action Buttons: Primary View Results, Secondary Generate Next */}
          <View style={styles.actionButtonsCol}>
            <Pressable
              accessibilityRole="button"
              onPress={onViewResults}
              style={({ pressed }) => [styles.viewResultsPrimaryBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.viewResultsPrimaryIcon}>📊</Text>
              <Text style={styles.viewResultsPrimaryText}>Vezi Rezultatele Finale & Raport Detaliat</Text>
            </Pressable>

          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  officialFormatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F6F0',
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  officialBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  examSectionTag: {
    backgroundColor: '#174D43',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examSectionText: {
    color: '#F6D97A',
    fontSize: 9,
    fontWeight: '900',
  },
  pointsTag: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointsText: {
    color: '#174D43',
    fontSize: 9,
    fontWeight: '800',
  },
  competencyTag: {
    backgroundColor: '#EAE7DE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  competencyText: {
    color: '#555A52',
    fontSize: 9,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  gradeTag: {
    backgroundColor: '#D45F47',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  topicText: {
    color: '#174D43',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  questionCounter: {
    color: '#174D43',
    fontSize: 12,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#EAE7DE',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#174D43',
    borderRadius: 4,
  },
  mouseReaderRow: {
    marginBottom: 14,
  },
  mouseReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6D97A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
  },
  mouseReadIcon: {
    fontSize: 16,
  },
  mouseReadText: {
    color: '#174D43',
    fontSize: 12,
    fontWeight: '800',
  },
  contextBox: {
    backgroundColor: '#F7F6F0',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F6D97A',
    marginBottom: 14,
  },
  contextHeader: {
    color: '#857850',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  contextText: {
    color: '#444841',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  promptText: {
    color: '#1D2925',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
  },
  hintContainer: {
    marginBottom: 14,
  },
  hintBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF9E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3E4B2',
  },
  hintBtnText: {
    color: '#8A6D19',
    fontSize: 11,
    fontWeight: '800',
  },
  hintContentText: {
    marginTop: 6,
    color: '#735B16',
    fontSize: 12,
    lineHeight: 17,
    backgroundColor: '#FFFDF5',
    padding: 10,
    borderRadius: 10,
  },
  choicesList: {
    gap: 10,
  },
  choiceItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 12,
  },
  choiceItemCorrect: {
    backgroundColor: '#EAF4EF',
    borderColor: '#348064',
  },
  choiceItemIncorrect: {
    backgroundColor: '#FDF0ED',
    borderColor: '#D97965',
  },
  choiceLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFECE6',
    color: '#555A52',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
    fontSize: 12,
    marginRight: 12,
  },
  choiceLetterCorrect: {
    backgroundColor: '#348064',
    color: '#FFFFFF',
  },
  choiceLetterIncorrect: {
    backgroundColor: '#D97965',
    color: '#FFFFFF',
  },
  choiceText: {
    flex: 1,
    color: '#2C332E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  resultBadge: {
    color: '#348064',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  resultBadgeErr: {
    color: '#D97965',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  feedbackContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#EAE7DE',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  feedbackTitleCorrect: {
    color: '#348064',
  },
  feedbackTitleIncorrect: {
    color: '#C85B47',
  },
  askMouseInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#174D43',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  askMouseInlineIcon: {
    fontSize: 14,
  },
  askMouseInlineText: {
    color: '#F6D97A',
    fontSize: 11,
    fontWeight: '800',
  },
  explanationTitle: {
    color: '#77776C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 4,
  },
  explanationText: {
    color: '#4A5048',
    fontSize: 13,
    lineHeight: 19,
  },
  actionButtonsCol: {
    marginTop: 18,
    gap: 10,
  },
  viewResultsPrimaryBtn: {
    height: 50,
    backgroundColor: '#174D43',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#174D43',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewResultsPrimaryIcon: {
    fontSize: 16,
  },
  viewResultsPrimaryText: {
    color: '#F6D97A',
    fontSize: 14,
    fontWeight: '900',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
