import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWalletStore } from '../../stores/walletStore';
import { BLOCK_ORDER, BLOCKS, planSummary } from '../../services/workflows/blocks';
import { BlockCard, BlockStatus } from '../../components/workflows/BlockCard';
import { BlockEditSheet } from '../../components/workflows/BlockEditSheet';

const short = (a: string) => (a.length > 9 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);

export default function WorkflowEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wf = useWorkflowStore((s) => s.workflows.find((w) => w.id === id));
  const { addBlock, updateBlock, removeBlock, moveBlock, setActive, renameWorkflow, deleteWorkflow, run } =
    useWorkflowStore();
  const { network } = useSettingsStore();
  const { refreshBalances } = useWalletStore();

  const [name, setName] = useState(wf?.name ?? '');
  const [statuses, setStatuses] = useState<Record<string, BlockStatus>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const runRef = useRef(false); // синхронный замок от двойного нажатия

  useEffect(() => {
    if (wf) setName(wf.name);
  }, [wf?.id]);

  if (!wf) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.centerText}>Сценарий не найден</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/automation')}>
            <Text style={styles.link}>К списку сценариев</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/automation'));
  const editing = wf.blocks.find((b) => b.id === editingId) ?? null;
  const editingIndex = editing ? wf.blocks.findIndex((b) => b.id === editing.id) : -1;

  const execute = async () => {
    if (runRef.current) return;
    runRef.current = true;
    setRunning(true);
    setResult(null);
    setStatuses({});
    try {
      const rec = await run(wf.id, { manual: true, network }, (i, st) =>
        setStatuses((s) => ({ ...s, [wf.blocks[i].id]: st })),
      );
      if (rec.status === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const sig = rec.payment ? `. Подпись транзакции ${short(rec.payment.signature)}` : '';
        setResult({ ok: true, text: `Выполнено: ${rec.steps.length} из ${wf.blocks.length} блоков${sig}` });
        if (rec.notifications.length) Alert.alert('Уведомление', rec.notifications.join('\n'));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setResult({ ok: false, text: rec.error || 'Сценарий остановлен' });
      }
      refreshBalances();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ ok: false, text: e?.message || 'Не удалось выполнить сценарий' });
    } finally {
      runRef.current = false;
      setRunning(false);
    }
  };

  const onRun = () => {
    if (runRef.current) return;
    if (wf.blocks.length === 0) {
      setResult({ ok: false, text: 'Добавьте хотя бы один блок, чтобы запустить сценарий' });
      return;
    }
    Alert.alert('Выполнить сценарий?', planSummary(wf), [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выполнить', onPress: execute },
    ]);
  };

  const onDeleteWorkflow = () =>
    Alert.alert('Удалить сценарий?', `«${wf.name}» будет удалён. Журнал запусков сохранится.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => { deleteWorkflow(wf.id); goBack(); } },
    ]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={goBack} accessibilityLabel="Назад">
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            onEndEditing={() => renameWorkflow(wf.id, name.trim() || 'Без названия')}
            placeholder="Название сценария"
            placeholderTextColor={Colors.textSecondary}
          />
          <Switch
            value={wf.active}
            onValueChange={(v) => setActive(wf.id, v)}
            trackColor={{ true: Colors.accent, false: Colors.surfaceLight }}
            accessibilityLabel="Активен"
          />
        </View>

        <Text style={styles.meta}>
          {wf.active ? 'Активен: в нужную дату предложит выполниться при открытии приложения' : 'Пауза: только ручной запуск'}
        </Text>

        {wf.blocks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Сценарий пуст. Добавьте первый блок: обычно это триггер, который запускает цепочку.</Text>
          </View>
        ) : (
          wf.blocks.map((b, i) => (
            <BlockCard
              key={b.id}
              block={b}
              status={statuses[b.id] ?? 'idle'}
              isLast={i === wf.blocks.length - 1}
              onPress={() => !running && setEditingId(b.id)}
            />
          ))
        )}

        {pickerOpen && (
          <View style={styles.picker}>
            {BLOCK_ORDER.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.pick}
                onPress={() => { addBlock(wf.id, t); setPickerOpen(false); }}
              >
                <Image source={BLOCKS[t].icon} style={styles.pickIcon} resizeMode="contain" />
                <Text style={styles.pickText}>{BLOCKS[t].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={() => setPickerOpen((v) => !v)} disabled={running}>
          <Text style={styles.addText}>{pickerOpen ? 'Скрыть список блоков' : '+ Добавить блок'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.runBtn, running && { opacity: 0.6 }]}
          onPress={onRun}
          disabled={running}
          activeOpacity={0.85}
        >
          <Text style={styles.runText}>{running ? 'Выполняется…' : '▶ Запустить сейчас'}</Text>
        </TouchableOpacity>

        {result && (
          <View style={[styles.result, result.ok ? styles.resultOk : styles.resultFail]}>
            <Text style={[styles.resultText, { color: result.ok ? Colors.success : Colors.error }]}>{result.text}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.delBtn} onPress={onDeleteWorkflow} disabled={running}>
          <Text style={styles.delText}>Удалить сценарий</Text>
        </TouchableOpacity>
      </ScrollView>

      <BlockEditSheet
        visible={!!editing}
        block={editing}
        canMoveUp={editingIndex > 0}
        canMoveDown={editingIndex >= 0 && editingIndex < wf.blocks.length - 1}
        onClose={() => setEditingId(null)}
        onSave={(cfg) => { if (editing) updateBlock(wf.id, editing.id, cfg); setEditingId(null); }}
        onMove={(dir) => editing && moveBlock(wf.id, editing.id, dir)}
        onDelete={() => {
          if (!editing) return;
          Alert.alert('Удалить блок?', BLOCKS[editing.type].label, [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: () => { removeBlock(wf.id, editing.id); setEditingId(null); } },
          ]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { color: Colors.textSecondary, fontSize: 13 },
  link: { color: Colors.accent, fontSize: 13, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { color: Colors.textPrimary, fontSize: 16 },
  nameInput: { flex: 1, color: Colors.textPrimary, fontSize: 16, fontWeight: '500', paddingVertical: 4 },
  meta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 14 },
  empty: { borderWidth: 0.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 12, padding: 20 },
  emptyText: { color: Colors.textSecondary, fontSize: 12.5, lineHeight: 19, textAlign: 'center' },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pick: {
    width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10, padding: 10,
  },
  pickIcon: { width: 18, height: 18 },
  pickText: { color: Colors.textPrimary, fontSize: 12.5, fontWeight: '500' },
  addBtn: { borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  addText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  runBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  runText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  result: { borderWidth: 0.5, borderRadius: 12, padding: 12, marginTop: 12 },
  resultOk: { backgroundColor: Colors.successGlow, borderColor: 'rgba(52, 211, 153, 0.35)' },
  resultFail: { backgroundColor: Colors.errorGlow, borderColor: 'rgba(248, 113, 113, 0.35)' },
  resultText: { fontSize: 12.5, lineHeight: 19 },
  delBtn: { alignItems: 'center', paddingVertical: 18, marginTop: 8 },
  delText: { color: Colors.error, fontSize: 12.5, fontWeight: '500' },
});
