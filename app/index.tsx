import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { PQBadge } from '../components/security/PQBadge';
import { Button } from '../components/ui/Button';
import { LoadingAnimation } from '../components/wallet/LoadingAnimation';
import { hasStoredWallet } from '../services/solana/wallet';

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [walletExists, setWalletExists] = useState(false);

  useEffect(() => {
    hasStoredWallet().then(setWalletExists);
  }, []);

  const handleLoadingFinish = () => {
    if (walletExists) {
      router.replace('/(tabs)/dashboard');
      return;
    }
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  if (loading) {
    return <LoadingAnimation onFinish={handleLoadingFinish} />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>GvardPay</Text>
          <Text style={styles.subtitle}>Платёжная система на блокчейне Solana</Text>
        </View>
        <View style={styles.badgeContainer}>
          <PQBadge />
        </View>
      </Animated.View>
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Button title="Создать кошелёк" variant="primary" size="lg" onPress={() => router.push('/(auth)/create-wallet')} />
        <View style={{ height: 16 }} />
        <Button title="Импортировать кошелёк" variant="outline" size="lg" onPress={() => router.push('/(auth)/import-wallet')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '500', color: Colors.accent, marginBottom: 12, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  badgeContainer: { marginTop: 24 },
  footer: { paddingBottom: 48 },
});
