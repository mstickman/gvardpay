import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useWorkflowStore } from '../stores/workflowStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useWalletStore } from '../stores/walletStore';
import { generateAndShareContract } from '../services/contractPdf';
import { RunRecord } from '../services/workflows/types';
import { BLOCKS } from '../services/workflows/blocks';

const short = (a: string) => (a.length > 9 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);

export default function JournalScreen() {
  const { runs, loaded, load } = useWorkflowStore();
  const { network } = useSettingsStore();
  const { publicKey } = useWalletStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) load();
  }, []);

  const openPdf = async (r: RunRecord) => {
    if (!r.payment || busyId) return;
    setBusyId(r.id);
    try {
      await generateAndShareContract(
        {
          signature: r.payment.signature,
          timestamp: r.startedAt,
          type: 'send',
          amount: r.payment.amount,
          token: r.payment.token,
          from: publicKey || '',
          to: r.payment.to,
          status: 'confirmed',
          fee: 0,
        },
        network,
        publicKey || '',
      );
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось сформировать документ');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/automation'))}
            accessibilityLabel="Назад"
          >
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Журнал запусков</Text>
          <View style={{ width: 30 }} />
        </View>

        {runs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Запусков пока не было</Text>
            <Text style={styles.emptyText}>Здесь появится каждый запуск сценария: шаги, результат и подпись транзакции.</Text>
          </View>
        ) : (
          runs.map((r) => {
            const ok = r.status === 'success';
            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.top}>
                  <Text style={styles.name} numberOfLines={1}>{r.workflowName}</Text>
                  <View style={[styles.badge, { backgroundColor: ok ? Colors.successGlow : Colors.errorGlow }]}>
                    <Text style={[styles.badgeText, { color: ok ? Colors.success : Colors.error }]}>{ok ? 'Успешно' : 'Ошибка'}</Text>
                  </View>
                </View>
                <Text style={styles.when}>
                  {new Date(r.startedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{r.manual ? 'вручную' : 'по расписанию'}
                </Text>

                {r.steps.map((s, i) => (
                  <View key={i} style={styles.step}>
                    <Text style={[styles.stepMark, { color: s.status === 'ok' ? Colors.success : Colors.error }]}>
                      {s.status === 'ok' ? '✓' : '✕'}
                    </Text>
                    <Text style={styles.stepText}>
                      <Text style={styles.stepType}>{BLOCKS[s.type].label}: </Text>
                      {s.message}
                    </Text>
                  </View>
                ))}

                {r.payment && (
                  <TouchableOpacity style={styles.pdfBtn} onPress={() => openPdf(r)} disabled={busyId === r.id}>
                    <Text style={styles.pdfText}>
                      {busyId === r.id ? 'Формирую PDF…' : `PDF-подтверждение · ${short(r.payment.signature)}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { color: Colors.textPrimary, fontSize: 16 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '500' },
  empty: { borderWidth: 0.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 12, padding: 20 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 6 },
  emptyText: { color: Colors.textSecondary, fontSize: 12.5, lineHeight: 19 },
  card: { backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  when: { color: Colors.textSecondary, fontSize: 11.5, marginTop: 3, marginBottom: 10 },
  step: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  stepMark: { fontSize: 13, fontWeight: '500', width: 14 },
  stepText: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 17 },
  stepType: { color: Colors.textPrimary, fontWeight: '500' },
  pdfBtn: { marginTop: 12, paddingVertical: 11, borderWidth: 1, borderColor: Colors.accent, borderRadius: 10, alignItems: 'center' },
  pdfText: { color: Colors.accent, fontSize: 12.5, fontWeight: '500' },
});
