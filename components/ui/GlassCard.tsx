import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'highlighted';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const borderColor = variant === 'highlighted' ? 'rgba(123, 97, 255, 0.35)' : 'rgba(123, 97, 255, 0.15)';

  return (
    <View style={[styles.card, { borderColor }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20, 25, 55, 0.6)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
});
