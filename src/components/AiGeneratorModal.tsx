import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { generateQuestionWithGemini } from '../services/geminiGeneratorService';
import { DifficultyLevel, GradeLevel, Question, Subject } from '../types';

type AiGeneratorModalProps = {
  visible: boolean;
  onClose: () => void;
  onQuestionGenerated: (q: Question) => void;
  currentSubject: Subject;
  currentGrade: GradeLevel;
  apiKey?: string;
};

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  visible,
  onClose,
  onQuestionGenerated,
  currentSubject,
  currentGrade,
  apiKey,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject>(currentSubject);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentGrade);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Mediu');
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    setSelectedSubject(currentSubject);
    setSelectedGrade(currentGrade);
  }, [currentSubject, currentGrade, visible]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newQuestion = await generateQuestionWithGemini(
        {
          subject: selectedSubject,
          grade: selectedGrade,
          difficulty,
        },
        apiKey
      );
      onQuestionGenerated(newQuestion);
      onClose();
    } catch (err) {
      console.error('Error generating question:', err);
      Alert.alert(
        'Nu s-a putut genera întrebarea',
        err instanceof Error ? err.message : 'Verifică conexiunea la internet și cheia Gemini.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.headerEmoji}>⚡</Text>
              <View>
                <Text style={styles.title}>Generator AI Întrebări 2026</Text>
                <Text style={styles.subtitle}>Conform Programei Oficiale de Evaluare Națională</Text>
              </View>
            </View>

            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>SELECTEAZĂ MATERIA</Text>
          <View style={styles.chipRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedSubject('romana')}
              style={[styles.chip, selectedSubject === 'romana' && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedSubject === 'romana' && styles.chipTextActive]}>
                📖 Limba Română
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedSubject('matematica')}
              style={[styles.chip, selectedSubject === 'matematica' && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedSubject === 'matematica' && styles.chipTextActive]}>
                📐 Matematică
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>SELECTEAZĂ CLASA (GIMNAZIU)</Text>
          <View style={styles.chipRow}>
            {(['Clasa V', 'Clasa VI', 'Clasa VII', 'Clasa VIII'] as GradeLevel[]).map((g) => (
              <Pressable
                key={g}
                accessibilityRole="button"
                onPress={() => setSelectedGrade(g)}
                style={[styles.chip, selectedGrade === g && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedGrade === g && styles.chipTextActive]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>NIVEL DIFICULTATE EXAMEN</Text>
          <View style={styles.chipRow}>
            {(['Ușor', 'Mediu', 'Avansat'] as DifficultyLevel[]).map((d) => (
              <Pressable
                key={d}
                accessibilityRole="button"
                onPress={() => setDifficulty(d)}
                style={[styles.chip, difficulty === d && styles.chipActiveDiff]}
              >
                <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>
                  {d === 'Ușor' ? '🟢 Ușor' : d === 'Mediu' ? '🟡 Mediu' : '🔴 Avansat'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>🐭 📖</Text>
            <Text style={styles.infoText}>
              Gemini AI extrage cerințele direct din documentele oficiale: „programa-de-examen-2026.pdf”.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isGenerating}
            onPress={handleGenerate}
            style={({ pressed }) => [styles.generateBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.generateBtnText}>
              {isGenerating ? 'Șoricelul răsfoiește programa 2026...' : '✨ Generează Întrebare Nouă 2026'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 20, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#F6F4ED',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#174D43',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#656A61',
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
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#77776C',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3DFD5',
  },
  chipActive: {
    backgroundColor: '#174D43',
    borderColor: '#174D43',
  },
  chipActiveDiff: {
    backgroundColor: '#D45F47',
    borderColor: '#D45F47',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52564E',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6D97A',
    padding: 10,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#174D43',
    fontWeight: '700',
    lineHeight: 16,
  },
  generateBtn: {
    height: 48,
    backgroundColor: '#174D43',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  generateBtnText: {
    color: '#F6D97A',
    fontSize: 14,
    fontWeight: '900',
  },
  btnPressed: {
    opacity: 0.88,
  },
});
