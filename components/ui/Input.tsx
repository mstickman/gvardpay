import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error ? styles.inputError : null
      ]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor="#5A5F7D"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeButton}>
            <Text style={styles.eyeIcon}>{isSecure ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#8A8FAD',
    fontSize: 13,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141937',
    borderWidth: 1,
    borderColor: '#1E2448',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#7B61FF',
  },
  inputError: {
    borderColor: '#FF4757',
  },
  icon: {
    marginRight: 12,
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF4757',
    fontSize: 12,
    marginTop: 4,
  },
});
