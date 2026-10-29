import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Subject } from '../types';

type SubjectTabsProps = {
  activeSubject: Subject;
  onSelectSubject: (subject: Subject) => void;
  counts: Record<Subject, number>;
};

export const SubjectTabs: React.FC<SubjectTabsProps> = ({
  activeSubject,
  onSelectSubject,
  counts,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SELECTEAZĂ MATERIA</Text>
      <View style={styles.tabContainer}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSubject === 'romana' }}
          onPress={() => onSelectSubject('romana')}
          style={[styles.tab, activeSubject === 'romana' && styles.tabActive]}
        >
          <Text style={styles.tabIcon}>📖</Text>
          <Text style={[styles.tabText, activeSubject === 'romana' && styles.tabTextActive]}>
            Limba Română
          </Text>
          <View style={[styles.countBadge, activeSubject === 'romana' && styles.countBadgeActive]}>
            <Text style={[styles.countText, activeSubject === 'romana' && styles.countTextActive]}>
              {counts.romana}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSubject === 'matematica' }}
          onPress={() => onSelectSubject('matematica')}
          style={[styles.tab, activeSubject === 'matematica' && styles.tabActive]}
        >
          <Text style={styles.tabIcon}>📐</Text>
          <Text style={[styles.tabText, activeSubject === 'matematica' && styles.tabTextActive]}>
            Matematică
          </Text>
          <View style={[styles.countBadge, activeSubject === 'matematica' && styles.countBadgeActive]}>
            <Text style={[styles.countText, activeSubject === 'matematica' && styles.countTextActive]}>
              {counts.matematica}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#77776C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAE7DE',
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#174D43',
  },
  tabIcon: {
    fontSize: 15,
  },
  tabText: {
    color: '#65675F',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#DFDBCF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: '#F6D97A',
  },
  countText: {
    color: '#44463E',
    fontSize: 11,
    fontWeight: '800',
  },
  countTextActive: {
    color: '#174D43',
  },
});
