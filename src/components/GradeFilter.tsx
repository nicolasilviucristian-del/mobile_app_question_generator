import React from 'react';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { GradeFilterOption } from '../types';

type GradeFilterProps = {
  selectedGrade: GradeFilterOption;
  onSelectGrade: (grade: GradeFilterOption) => void;
};

const GRADE_OPTIONS: { label: string; value: GradeFilterOption }[] = [
  { label: 'Toate clasele', value: 'toate' },
  { label: 'Clasa V', value: 'Clasa V' },
  { label: 'Clasa VI', value: 'Clasa VI' },
  { label: 'Clasa VII', value: 'Clasa VII' },
  { label: 'Clasa VIII', value: 'Clasa VIII' },
];

export const GradeFilter: React.FC<GradeFilterProps> = ({
  selectedGrade,
  onSelectGrade,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>FILTREAZĂ DUPĂ CLASĂ</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {GRADE_OPTIONS.map((item) => {
          const isSelected = selectedGrade === item.value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectGrade(item.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
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
  scrollContent: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3DFD5',
  },
  chipSelected: {
    backgroundColor: '#D45F47',
    borderColor: '#D45F47',
  },
  chipText: {
    color: '#52564E',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
