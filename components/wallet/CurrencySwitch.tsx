import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface CurrencySwitchProps {
  options: [string, string];
  value: string;
  onChange: (value: string) => void;
}

export const CurrencySwitch: React.FC<CurrencySwitchProps> = ({ options, value, onChange }) => {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.tab, value === opt && styles.tabActive]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.label, value === opt && styles.labelActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 2,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
