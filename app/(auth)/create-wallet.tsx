import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { ICONS } from '../../constants/icons';
import { LoadingAnimation } from '../../components/wallet/LoadingAnimation';
import { useWalletStore } from '../../stores/walletStore';

export default function CreateWalletScreen() {
  const { createWallet, publicKey, isLoading, error } = useWalletStore();
  const [phase, setPhase] = useState<'idle' | 'animating' | 'created'>('idle');

  const handleCreate = async () => {
    await createWallet();
    const state = useWalletStore.getState();
    if (state.publicKey && !state.error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('animating');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (phase === 'animating') {
    return <LoadingAnimation icon={ICONS.walletCreated} showName={false} onFinish={() => setPhase('created')} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {phase === 'idle' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.description}>
                Создайте новый кошелёк с постквантовой защитой ML-KEM-768 для безопасного хранения ваших активов.
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Создать защищённый кошелёк</Text>}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.successTitle}>Кошелёк создан</Text>
              <Text style={styles.successText}>С постквантовой защитой ML-KEM-768</Text>
              <Text style={styles.addrLabel}>Ваш адрес:</Text>
              <Text style={styles.addr} selectable>{publicKey}</Text>
            </View>
            <View style={styles.securityCard}>
              <Text style={styles.securityText}>
                Ваш приватный ключ зашифрован алгоритмом ML-KEM-768 (FIPS 203), устойчивым к атакам квантовых компьютеров.
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/dashboard')}>
              <Text style={styles.primaryBtnText}>Перейти к кошельку</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center',
  },
  description: { color: Colors.textSecondary, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  primaryBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '500' },
  errorText: { color: Colors.error, marginTop: 10, textAlign: 'center', fontSize: 12.5 },
  successTitle: { color: Colors.success, fontSize: 18, fontWeight: '500', marginBottom: 8 },
  successText: { color: Colors.textPrimary, fontSize: 13, marginBottom: 18, textAlign: 'center' },
  addrLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 6 },
  addr: { color: Colors.accent, fontSize: 13, textAlign: 'center' },
  securityCard: {
    padding: 14, backgroundColor: 'rgba(52, 211, 153, 0.08)', borderRadius: 12,
    marginBottom: 20, borderWidth: 0.5, borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  securityText: { color: Colors.success, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
