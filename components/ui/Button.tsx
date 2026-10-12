import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const height = size === 'sm' ? 40 : size === 'lg' ? 60 : 52;
  const opacity = disabled ? 0.5 : 1;

  const content = (
    <View style={[styles.contentContainer, { height }]}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#7B61FF' : '#FFF'} />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[
            styles.title,
            (variant === 'outline' || variant === 'ghost') && styles.titleDark
          ]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'primary': return ['#7B61FF', '#00D9FF'];
      case 'secondary': return ['#00E68A', '#00D9FF'];
      case 'danger': return ['#FF4757', '#FF6B9D'];
      default: return ['transparent', 'transparent'];
    }
  };

  const isGradient = variant === 'primary' || variant === 'secondary' || variant === 'danger';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { opacity },
        variant === 'outline' && styles.outlineButton,
        style
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    borderRadius: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#7B61FF',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  titleDark: {
    color: '#7B61FF',
  }
});
