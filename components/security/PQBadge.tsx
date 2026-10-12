import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PQBadgeProps {
  variant?: 'compact' | 'full';
}

export const PQBadge: React.FC<PQBadgeProps> = ({ variant = 'full' }) => {
  return (
    <LinearGradient
      colors={['rgba(123, 97, 255, 0.2)', 'rgba(0, 217, 255, 0.2)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <Text style={styles.icon}>🛡️</Text>
      {variant === 'full' && (
        <Text style={styles.text}>PQ Защита</Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  }
});
