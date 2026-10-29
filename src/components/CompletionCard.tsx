import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Subject } from '../types';

type CompletionCardProps = {
  score: number;
  total: number;
  subject: Subject;
  onRestart: () => void;
  onOpenLiveAgent: () => void;
};

export const CompletionCard: React.FC<CompletionCardProps> = ({
  score,
  total,
  subject,
  onRestart,
  onOpenLiveAgent,
}) => {
  const percentage = Math.round((score / Math.max(total, 1)) * 100);
  const subjectName = subject === 'romana' ? 'Limba Română' : 'Matematică';

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>MATERIE FINALIZATĂ</Text>
      <Text style={styles.title}>Felicitări! Ai terminat antrenamentul.</Text>

      <View style={styles.scoreBox}>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={styles.scoreSubtext}>
          {score} din {total} exerciții rezolvate corect la {subjectName}
        </Text>
      </View>

      <Text style={styles.messageText}>
        {percentage >= 80
          ? 'Excelent! Stăpânești foarte bine materia pentru Evaluarea Națională. Continuă tot așa!'
          : percentage >= 50
          ? 'Rezultat bun! Mai ai mici detalii de pus la punct. Poți folosi asistentul vocal Gemini Live pentru a-ți clarifica orice nelămurire.'
          : 'Continuă să exersezi! Cu puțin mai mult antrenament și cu ajutorul profesorului AI Gemini Live, vei obține un scor excelent.'}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onRestart}
          style={({ pressed }) => [styles.restartBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.restartBtnText}>Reia exercițiile ↻</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onOpenLiveAgent}
          style={({ pressed }) => [styles.liveBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.liveBtnIcon}>🎙️</Text>
          <Text style={styles.liveBtnText}>Discută cu Gemini Live</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
  },
  eyebrow: {
    color: '#D45F47',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
    color: '#1D2925',
    marginTop: 6,
  },
  scoreBox: {
    backgroundColor: '#EAF4EF',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 16,
  },
  percentageText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#174D43',
  },
  scoreSubtext: {
    fontSize: 13,
    fontWeight: '700',
    color: '#348064',
    marginTop: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#52564E',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionsRow: {
    gap: 10,
  },
  restartBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EAE7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartBtnText: {
    color: '#44463E',
    fontWeight: '800',
    fontSize: 14,
  },
  liveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#174D43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  liveBtnIcon: {
    fontSize: 16,
  },
  liveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
