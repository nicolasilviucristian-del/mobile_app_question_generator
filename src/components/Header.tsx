import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type HeaderProps = {
  score: number;
  totalAnswered: number;
  onOpenLiveAgent: () => void;
};

export const Header: React.FC<HeaderProps> = ({ score, totalAnswered, onOpenLiveAgent }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>EN</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>ATELIER DE ÎNVĂȚARE</Text>
            <Text style={styles.brandSubtitle}>EVALUAREA NAȚIONALĂ • CLASELE V-VIII</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpenLiveAgent}
          style={({ pressed }) => [styles.mouseAgentBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.mouseIcon}>🐭</Text>
          <Text style={styles.mouseText}>Șoricelul AI</Text>
          <View style={styles.liveDot} />
        </Pressable>
      </View>

      <Text style={styles.mainHeading}>
        Învățăm împreună cu{'\n'}Șoricelul Înțelept 🐭
      </Text>
      <Text style={styles.subHeading}>
        Sute de exerciții + Asistent vocal interactiv cu voce de șoarece (Gemini Live).
      </Text>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{score}</Text>
          <Text style={styles.statLabel}>răspunsuri corecte</Text>
        </View>

        <Text style={styles.statDivider}>/</Text>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalAnswered}</Text>
          <Text style={styles.statLabel}>exerciții rezolvate</Text>
        </View>

        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Gimnaziu V-VIII</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandGroup: {
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
  brandTitle: {
    color: '#174D43',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: '#68685E',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  mouseAgentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#174D43',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 3,
    shadowColor: '#174D43',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  btnPressed: {
    opacity: 0.85,
  },
  mouseIcon: {
    fontSize: 16,
  },
  mouseText: {
    color: '#F6D97A',
    fontWeight: '900',
    fontSize: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ECA77',
  },
  mainHeading: {
    color: '#1D2925',
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subHeading: {
    color: '#555A52',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statNumber: {
    color: '#174D43',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#73746B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    color: '#C4BFB2',
    fontSize: 22,
    marginHorizontal: 16,
  },
  badgeContainer: {
    marginLeft: 'auto',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6D97A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#174D43',
    fontWeight: '800',
    fontSize: 10,
  },
});
