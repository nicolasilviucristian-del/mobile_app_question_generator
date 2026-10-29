import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Subject } from '../types';

type HomeScreenProps = {
  onSelectSubject: (subject: Subject) => void;
  totalScore: number;
  totalGeneratedCount: number;
  onOpenSettings: () => void;
  apiKeySet: boolean;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectSubject,
  totalScore,
  totalGeneratedCount,
  onOpenSettings,
  apiKeySet,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>EN</Text>
          </View>
          <View>
            <Text style={styles.brandName}>ATELIER DE ÎNVĂȚARE 🐭</Text>
            <Text style={styles.brandSub}>EVALUAREA NAȚIONALĂ GIMNAZIU 2026</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.keyBtn}>
          <Text style={styles.keyBtnIcon}>{apiKeySet ? '🔑' : '⚙️'}</Text>
          <Text style={styles.keyBtnText}>{apiKeySet ? 'API Key Ok' : 'Cheie API'}</Text>
        </Pressable>
      </View>

      {/* Main Title Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTag}>PROGRAMA OFICIALĂ 2026 (PDF)</Text>
        <Text style={styles.heroTitle}>
          Generare Nelimitată de Exerciții cu Gemini AI
        </Text>
        <Text style={styles.heroDesc}>
          Alege materia dorită. AI-ul creează pe loc întrebări oficiale de examen, iar Șoricelul Înțelept 🐭 ți le citește și îți oferă explicații vocale!
        </Text>
      </View>

      {/* Stats Counter Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalGeneratedCount}</Text>
          <Text style={styles.statLabel}>exerciții AI generate</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalScore}</Text>
          <Text style={styles.statLabel}>răspunsuri corecte</Text>
        </View>

        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>Nelimitate</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>ALEGE MATERIA DE EXAMEN</Text>

      {/* Romanian Subject Card */}
      <Pressable
        accessibilityRole="button"
        onPress={() => onSelectSubject('romana')}
        style={({ pressed }) => [styles.subjectCard, styles.romanaCard, pressed && styles.cardPressed]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBox}>
            <Text style={styles.cardIcon}>📖</Text>
          </View>
          <View style={styles.badgeSyllabus}>
            <Text style={styles.badgeSyllabusText}>Programa 2026 DOOM 3</Text>
          </View>
        </View>

        <Text style={styles.subjectTitle}>Limba și Literatura Română</Text>
        <Text style={styles.subjectDesc}>
          Exerciții generate de AI: Lectură & Comprehesiune, Morfosintaxă, DOOM 3, Cazurile substantivului, Verbe, Figuri de stil și Ortoepie.
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.actionText}>Start Exerciții AI Română</Text>
          <Text style={styles.actionArrow}>→</Text>
        </View>
      </Pressable>

      {/* Math Subject Card */}
      <Pressable
        accessibilityRole="button"
        onPress={() => onSelectSubject('matematica')}
        style={({ pressed }) => [styles.subjectCard, styles.mateCard, pressed && styles.cardPressed]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, styles.mateIconBox]}>
            <Text style={styles.cardIcon}>📐</Text>
          </View>
          <View style={styles.badgeSyllabus}>
            <Text style={styles.badgeSyllabusText}>Programa 2026 Algebră & Geometrie</Text>
          </View>
        </View>

        <Text style={styles.subjectTitle}>Matematică</Text>
        <Text style={styles.subjectDesc}>
          Exerciții generate de AI: Algebră (Formule calcul prescurtat, Funcții, Ecuații), Geometrie plană 2D (Pitagora, Thales) și Spațiu 3D (Cub, Piramidă).
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.actionText}>Start Exerciții AI Matematică</Text>
          <Text style={styles.actionArrow}>→</Text>
        </View>
      </Pressable>

      <Text style={styles.footerNote}>
        Atelier de Învățare • Evaluarea Națională 2026 • Șoricelul Înțelept Live 🐭
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
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    backgroundColor: '#174D43',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#F6D97A',
    fontWeight: '900',
    fontSize: 16,
  },
  brandName: {
    color: '#174D43',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  brandSub: {
    color: '#656A61',
    fontWeight: '700',
    fontSize: 9,
    marginTop: 2,
  },
  keyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 4,
  },
  keyBtnIcon: {
    fontSize: 12,
  },
  keyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#174D43',
  },
  heroBanner: {
    backgroundColor: '#174D43',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  heroTag: {
    color: '#F6D97A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroDesc: {
    color: '#EAF4EF',
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'flex-start',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#174D43',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#73746B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E8E5DC',
    marginHorizontal: 16,
  },
  statBadge: {
    marginLeft: 'auto',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6D97A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#174D43',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#77776C',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  romanaCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#D45F47',
  },
  mateCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#174D43',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FDF0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mateIconBox: {
    backgroundColor: '#EAF4EF',
  },
  cardIcon: {
    fontSize: 22,
  },
  badgeSyllabus: {
    backgroundColor: '#F7F6F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeSyllabusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#555A52',
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1D2925',
    marginBottom: 6,
  },
  subjectDesc: {
    fontSize: 13,
    color: '#656A61',
    lineHeight: 19,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#174D43',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  actionArrow: {
    color: '#F6D97A',
    fontWeight: '900',
    fontSize: 16,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8A8D85',
    lineHeight: 16,
    marginTop: 14,
  },
});
