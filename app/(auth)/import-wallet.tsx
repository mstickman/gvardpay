import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { PQBadge } from '../../components/security/PQBadge';
import { useWalletStore } from '../../stores/walletStore';

export default function ImportWalletScreen() {
  const [tab, setTab] = useState<'key' | 'mnemonic'>('mnemonic');
  const [inputValue, setInputValue] = useState('');
  const { importWallet, importWalletFromMnemonic, isLoading, error } = useWalletStore();

  const handleImport = async () => {
    if (!inputValue.trim()) return;

    if (tab === 'key') {
      await importWallet(inputValue.trim());
    } else {
      await importWalletFromMnemonic(inputValue.trim());
    }

    // importWallet/importWalletFromMnemonic ловят ошибки сами и кладут
    // их в стор, а не бросают — поэтому try/catch тут ничего не поймает.
    // Проверяем результат напрямую через стор.
    const state = useWalletStore.getState();
    if (state.publicKey && !state.error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/dashboard');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Импорт кошелька" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'mnemonic' && styles.activeTab]} 
            onPress={() => setTab('mnemonic')}
          >
            <Text style={[styles.tabText, tab === 'mnemonic' && styles.activeTabText]}>Фраза</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'key' && styles.activeTab]} 
            onPress={() => setTab('key')}
          >
            <Text style={[styles.tabText, tab === 'key' && styles.activeTabText]}>Ключ</Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>
            {tab === 'mnemonic' ? 'Введите мнемоническую фразу (12 или 24 слова):' : 'Введите приватный ключ (Base58):'}
          </Text>
          <Input
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={tab === 'mnemonic' ? 'word1 word2 word3...' : '...'}
            multiline={tab === 'mnemonic'}
            secureTextEntry={tab === 'key'}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </GlassCard>

        <View style={styles.badgeContainer}>
          <PQBadge />
          <Text style={styles.securityInfo}>Ваш ключ будет надежно зашифрован</Text>
        </View>

        <Button
          title="Импортировать"
          variant="primary"
          onPress={handleImport}
          loading={isLoading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scroll: { padding: 20 },
  tabs: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#141937', borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#7B61FF' },
  tabText: { color: '#8B8FAE', fontSize: 15, fontWeight: '500' },
  activeTabText: { color: '#FFFFFF' },
  card: { padding: 20, marginBottom: 20 },
  label: { color: '#FFFFFF', marginBottom: 12, fontSize: 15 },
  errorText: { color: '#FF4757', marginTop: 10, fontSize: 13 },
  badgeContainer: { alignItems: 'center', marginBottom: 30 },
  securityInfo: { color: '#8B8FAE', fontSize: 13, marginTop: 10 },
});
