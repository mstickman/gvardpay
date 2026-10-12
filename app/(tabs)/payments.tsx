import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWalletStore } from '../../stores/walletStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { sendSOL, sendSPLToken } from '../../services/solana/tokens';
import { USDC_DEVNET, USDT_DEVNET, USDC_MAINNET, USDT_MAINNET } from '../../constants/tokens';
import { Colors } from '../../constants/colors';
import { CurrencySwitch } from '../../components/wallet/CurrencySwitch';
import { QrScannerModal } from '../../components/wallet/QrScannerModal';
import { SendSuccessScreen } from '../../components/wallet/SendSuccessScreen';
import { getSolPriceUsd } from '../../services/price';
import { formatBalance } from '../../utils/format';

const TOKENS: ('SOL' | 'USDC' | 'USDT')[] = ['SOL', 'USDC', 'USDT'];

interface SuccessInfo {
  amount: number;
  token: string;
  timestamp: number;
  solPriceAtSend?: number;
}

export default function PaymentsScreen() {
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'SOL'>('SOL');
  const [address, setAddress] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [amountCurrency, setAmountCurrency] = useState<'SOL' | 'USD'>('SOL');
  const [solPrice, setSolPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  // Замок от двойного нажатия. setLoading обновляется асинхронно — два быстрых
  // тапа успевают оба пройти проверку до перерисовки. Ref переключается
  // мгновенно, поэтому второй тап гарантированно упирается в замок.
  const sendingRef = useRef(false);
  const { network } = useSettingsStore();
  const { solBalance, tokenBalances, refreshBalances } = useWalletStore();

  React.useEffect(() => { getSolPriceUsd().then(setSolPrice); }, []);

  const availableBalance = (): string => {
    if (selectedToken === 'SOL') return formatBalance(solBalance, 4);
    const tb = tokenBalances.find(t => t.symbol === selectedToken);
    return tb?.uiBalance || '0';
  };

  // Реальная сумма для отправки — всегда в единицах выбранного токена.
  // Переключатель SOL/USD влияет только на то, как пользователь её вводит
  // (актуально только когда выбран токен SOL — USDC/USDT сами по себе доллары).
  const resolvedAmount = (): number => {
    const raw = parseFloat(amountInput) || 0;
    if (selectedToken !== 'SOL' || amountCurrency === 'SOL') return raw;
    return solPrice > 0 ? raw / solPrice : 0;
  };

  const handleSend = async () => {
    if (sendingRef.current) return;
    if (!address.trim()) {
      Alert.alert('Ошибка', 'Введите адрес получателя');
      return;
    }
    const amount = resolvedAmount();
    if (!amount || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    sendingRef.current = true;
    setLoading(true);
    try {
      let signature: string;
      if (selectedToken === 'SOL') {
        signature = await sendSOL(address.trim(), amount);
      } else {
        if (network === 'localnet') {
          throw new Error('На Localnet нет готового USDC/USDT — отправляйте SOL.');
        }
        const isDevnet = network === 'devnet';
        const tokenInfo = selectedToken === 'USDC'
          ? (isDevnet ? USDC_DEVNET : USDC_MAINNET)
          : (isDevnet ? USDT_DEVNET : USDT_MAINNET);
        signature = await sendSPLToken(address.trim(), tokenInfo.mint, amount, tokenInfo.decimals);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess({
        amount,
        token: selectedToken,
        timestamp: Date.now(),
        solPriceAtSend: selectedToken === 'SOL' ? solPrice : undefined,
      });
      setAddress('');
      setAmountInput('');
      refreshBalances();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Ошибка', e.message || 'Ошибка транзакции');
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SendSuccessScreen
        amount={success.amount}
        token={success.token}
        timestamp={success.timestamp}
        solPriceAtSend={success.solPriceAtSend}
        onDone={() => {
          setSuccess(null);
          router.replace('/(tabs)/dashboard');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.screenTitle}>Отправить</Text>

          <Text style={styles.label}>Токен</Text>
          <View style={styles.tokRow}>
            {TOKENS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tokBtn, selectedToken === t && styles.tokBtnActive]}
                onPress={() => setSelectedToken(t)}
              >
                <Text style={[styles.tokBtnText, selectedToken === t && styles.tokBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Доступно: {availableBalance()} {selectedToken}</Text>

          <Text style={styles.label}>Адрес получателя</Text>
          <View style={styles.field}>
            <TextInput
              style={styles.fieldInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Вставьте адрес"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setScannerOpen(true)} accessibilityLabel="Сканировать QR">
              <Text style={styles.fieldIcon}>▦</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Сумма</Text>
          {selectedToken === 'SOL' && (
            <View style={{ marginBottom: 10 }}>
              <CurrencySwitch options={['SOL', 'USD']} value={amountCurrency} onChange={(v) => setAmountCurrency(v as 'SOL' | 'USD')} />
            </View>
          )}
          <View style={styles.field}>
            <TextInput
              style={[styles.fieldInput, styles.amountInput]}
              value={amountInput}
              onChangeText={setAmountInput}
              placeholder="0.00"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.amountUnit}>{selectedToken === 'SOL' ? amountCurrency : selectedToken}</Text>
          </View>
          {selectedToken === 'SOL' && amountCurrency === 'USD' && solPrice > 0 && (
            <Text style={styles.hint}>≈ {resolvedAmount().toFixed(4)} SOL</Text>
          )}

          <TouchableOpacity
            style={[styles.sendBtn, (!address || !amountInput || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!address || !amountInput || loading}
          >
            <Text style={styles.sendBtnText}>{loading ? 'Отправка...' : 'Отправить'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <QrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(value) => setAddress(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  screenTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500', marginBottom: 18 },
  label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 20, marginBottom: 8 },
  hint: { color: Colors.textSecondary, fontSize: 11, marginTop: 6 },
  tokRow: { flexDirection: 'row', gap: 8 },
  tokBtn: { flex: 1, backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  tokBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tokBtnText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  tokBtnTextActive: { color: '#FFFFFF' },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11,
  },
  fieldInput: { flex: 1, color: Colors.textPrimary, fontSize: 13 },
  fieldIcon: { fontSize: 17, color: Colors.textSecondary },
  amountInput: { fontSize: 15 },
  amountUnit: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  sendBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '500' },
});
