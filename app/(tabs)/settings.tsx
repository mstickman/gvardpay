import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWalletStore } from '../../stores/walletStore';
import { exportSecretKey } from '../../services/solana/wallet';
import { NetworkName } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { PQBadge } from '../../components/security/PQBadge';
import { checkNode, checkWebSocket, normalizeRpcUrl, CheckResult } from '../../services/solana/rpcUrl';

const NETWORKS: { id: NetworkName; label: string; color: string; hint: string }[] = [
  { id: 'devnet', label: 'Devnet', color: '#00E68A', hint: 'Публичная тестовая сеть Solana' },
  { id: 'localnet', label: 'Localnet', color: '#FFB800', hint: 'Свой solana-test-validator — без лимитов на airdrop' },
  { id: 'mainnet', label: 'Mainnet', color: '#00D9FF', hint: 'Настоящая сеть, настоящие деньги' },
];

export default function SettingsScreen() {
  const { network, biometricEnabled, setNetwork, setBiometric, localRpcUrl, setLocalRpcUrl, resetLocalRpcUrl } =
    useSettingsStore();
  const { disconnect, refreshBalances } = useWalletStore();

  const [rpcDraft, setRpcDraft] = useState(localRpcUrl);
  const [rpcError, setRpcError] = useState('');
  const [checking, setChecking] = useState(false);
  const [checks, setChecks] = useState<{ http: CheckResult; ws: CheckResult } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRpcDraft(localRpcUrl);
  }, [localRpcUrl]);

  const onRpcChange = (v: string) => {
    setRpcDraft(v);
    setRpcError('');
    setChecks(null);
    setSaved(false);
  };

  const onCheckRpc = async () => {
    const n = normalizeRpcUrl(rpcDraft);
    if (!n.ok) return setRpcError(n.error);
    setRpcDraft(n.url);
    setChecking(true);
    setChecks(null);
    const [http, ws] = await Promise.all([checkNode(n.url), checkWebSocket(n.url)]);
    setChecks({ http, ws });
    setChecking(false);
  };

  const onSaveRpc = async () => {
    const n = normalizeRpcUrl(rpcDraft);
    if (!n.ok) return setRpcError(n.error);
    await setLocalRpcUrl(n.url);
    setRpcDraft(n.url);
    setSaved(true);
    if (network === 'localnet') refreshBalances();
  };

  const onResetRpc = async () => {
    await resetLocalRpcUrl();
    setChecks(null);
    setRpcError('');
    setSaved(false);
    if (network === 'localnet') refreshBalances();
  };

  const handleExport = async () => {
    const key = await exportSecretKey();
    if (key) Alert.alert('Ваш приватный ключ', key);
  };

  const handleLogout = async () => {
    await disconnect();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text style={styles.screenTitle}>Настройки</Text>

        <Text style={styles.sectionLabel}>Сеть</Text>
        <View style={styles.card}>
          {NETWORKS.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.netRow, network === n.id && styles.netRowActive]}
              onPress={() => setNetwork(n.id)}
            >
              <View style={[styles.dot, { backgroundColor: n.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.netName}>{n.label}</Text>
                <Text style={styles.netHint}>{n.hint}</Text>
              </View>
              {network === n.id && <Text style={[styles.netCheck, { color: n.color }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Локальный узел (Localnet)</Text>
        <View style={styles.card}>
          <Text style={styles.rpcHint}>
            Адрес вашего solana-test-validator. Меняется здесь, пересобирать приложение не нужно.
          </Text>
          <View style={styles.rpcField}>
            <TextInput
              style={styles.rpcInput}
              value={rpcDraft}
              onChangeText={onRpcChange}
              placeholder="192.168.1.23:8899"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
          {!!rpcError && <Text style={styles.rpcError}>{rpcError}</Text>}

          <View style={styles.rpcBtnRow}>
            <TouchableOpacity style={styles.rpcBtn} onPress={onCheckRpc} disabled={checking} activeOpacity={0.8}>
              {checking ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={styles.rpcBtnText}>Проверить</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rpcBtn, styles.rpcBtnPrimary]} onPress={onSaveRpc} activeOpacity={0.85}>
              <Text style={[styles.rpcBtnText, { color: '#FFFFFF' }]}>Сохранить</Text>
            </TouchableOpacity>
          </View>

          {checks && (
            <View style={styles.checks}>
              <Text style={[styles.checkLine, { color: checks.http.ok ? Colors.success : Colors.error }]}>
                {checks.http.ok ? '✓' : '✕'} HTTP: {checks.http.message}
              </Text>
              <Text style={[styles.checkLine, { color: checks.ws.ok ? Colors.success : Colors.error }]}>
                {checks.ws.ok ? '✓' : '✕'} {checks.ws.message}
              </Text>
            </View>
          )}
          {saved && <Text style={[styles.checkLine, { color: Colors.success }]}>Сохранено{network === 'localnet' ? ' и применено' : '. Применится при выборе Localnet'}</Text>}

          <TouchableOpacity onPress={onResetRpc} style={styles.rpcReset}>
            <Text style={styles.rpcResetText}>Сбросить к значению по умолчанию</Text>
          </TouchableOpacity>
          <Text style={styles.rpcHint}>
            IP ноутбука: ipconfig getifaddr en0 (Mac). Для iOS-симулятора: 127.0.0.1:8899, для Android-эмулятора: 10.0.2.2:8899.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Безопасность</Text>
        <View style={styles.card}>
          <View style={styles.pqRow}>
            <PQBadge />
            <Text style={styles.pqText}>Кошелёк защищён постквантовым шифрованием ML-KEM-768</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.rowText}>Face ID</Text>
            <TouchableOpacity
              style={[styles.toggle, biometricEnabled && styles.toggleOn]}
              onPress={() => setBiometric(!biometricEnabled)}
            >
              <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actLink} onPress={handleExport}>
            <Text style={styles.actLinkText}>Экспортировать ключ</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Информация</Text>
        <View style={styles.card}>
          <Text style={styles.infoText}>GvardPay v1.0.0</Text>
          <Text style={styles.infoText}>Блокчейн: Solana</Text>
          <Text style={styles.infoText}>PQ-алгоритмы: ML-KEM-768, ML-DSA-65</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  screenTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500', marginBottom: 18 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 18, marginBottom: 8 },
  card: { backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border, borderRadius: 12, padding: 10 },
  netRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, marginBottom: 2 },
  netRowActive: { backgroundColor: 'rgba(76, 126, 255, 0.12)' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 },
  netName: { color: Colors.textPrimary, fontSize: 13.5, fontWeight: '500' },
  netHint: { color: Colors.textSecondary, fontSize: 11, marginTop: 1 },
  netCheck: { fontSize: 15, marginLeft: 8 },
  pqRow: { alignItems: 'center', paddingBottom: 14, marginBottom: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  pqText: { color: Colors.success, textAlign: 'center', marginTop: 8, fontSize: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  rowText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  toggle: { width: 36, height: 20, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 0.5, borderColor: Colors.border, padding: 2 },
  toggleOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleThumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.textSecondary },
  toggleThumbOn: { backgroundColor: '#FFFFFF', alignSelf: 'flex-end' },
  actLink: { paddingVertical: 10, paddingHorizontal: 4 },
  actLinkText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  infoText: { color: Colors.textSecondary, fontSize: 12, paddingVertical: 4, paddingHorizontal: 4 },
  rpcHint: { color: Colors.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 4, marginBottom: 4, paddingHorizontal: 2 },
  rpcField: {
    backgroundColor: Colors.background, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, marginTop: 8,
  },
  rpcInput: { color: Colors.textPrimary, fontSize: 13.5 },
  rpcError: { color: Colors.error, fontSize: 12, marginTop: 8, paddingHorizontal: 2 },
  rpcBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rpcBtn: {
    flex: 1, borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 40,
  },
  rpcBtnPrimary: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  rpcBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  checks: { marginTop: 12, gap: 4, paddingHorizontal: 2 },
  checkLine: { fontSize: 12, lineHeight: 17, marginTop: 6, paddingHorizontal: 2 },
  rpcReset: { alignItems: 'center', paddingVertical: 12 },
  rpcResetText: { color: Colors.accent, fontSize: 12, fontWeight: '500' },
  logoutBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: Colors.error, fontSize: 13, fontWeight: '500' },
});
