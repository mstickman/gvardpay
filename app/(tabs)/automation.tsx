import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useWorkflowStore } from '../../stores/workflowStore';
import { BLOCKS } from '../../services/workflows/blocks';
import { Workflow } from '../../services/workflows/types';

const meta = (w: Workflow): string => {
  const t = w.blocks.find((b) => b.type === 'trigger');
  const n = w.blocks.length;
  const blocks = `${n} ${n === 1 ? 'блок' : n >= 2 && n <= 4 ? 'блока' : 'блоков'}`;
  if (!t) return n === 0 ? 'Пока пусто' : blocks;
  const c: any = t.config;
  return c.mode === 'monthly' ? `Каждое ${c.dayOfMonth}-е число · ${blocks}` : `Только вручную · ${blocks}`;
};

const lastRun = (w: Workflow): string =>
  w.lastRunAt
    ? `Последний запуск ${new Date(w.lastRunAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} · успешно`
    : 'Запусков пока не было';

export default function AutomationScreen() {
  const { workflows, loaded, load, createWorkflow } = useWorkflowStore();

  useEffect(() => {
    if (!loaded) load();
  }, []);

  const open = (id: string) => router.push(`/workflow/${id}`);

  const onNew = () => {
    Alert.alert('Новый сценарий', 'С чего начать?', [
      { text: 'Выплата зарплаты (шаблон)', onPress: () => open(createWorkflow('salary')) },
      { text: 'Пустой сценарий', onPress: () => open(createWorkflow('empty')) },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Автоматизация</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/journal')} accessibilityLabel="Журнал запусков">
            <Text style={styles.iconBtnText}>≡</Text>
          </TouchableOpacity>
        </View>

        {workflows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Соберите первый сценарий</Text>
            <Text style={styles.emptyText}>
              Сценарий — цепочка блоков: проверка даты, расчёт суммы, проверка получателя, платёж, уведомление и запись в учёт. Начните с шаблона выплаты зарплаты.
            </Text>
          </View>
        ) : (
          workflows.map((w) => (
            <TouchableOpacity key={w.id} style={styles.card} activeOpacity={0.8} onPress={() => open(w.id)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{w.name}</Text>
                <View style={[styles.badge, w.active ? styles.badgeOn : styles.badgeOff]}>
                  <Text style={[styles.badgeText, { color: w.active ? Colors.success : Colors.textSecondary }]}>
                    {w.active ? 'Активен' : 'Пауза'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{meta(w)}</Text>
              {w.blocks.length > 0 && (
                <View style={styles.mini}>
                  {w.blocks.map((b) => (
                    <Image key={b.id} source={BLOCKS[b.type].icon} style={styles.miniIcon} resizeMode="contain" />
                  ))}
                </View>
              )}
              <Text style={styles.cardLast}>{lastRun(w)}</Text>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.newBtn} onPress={onNew} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ Новый сценарий</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Сценарии выполняются на этом устройстве: вручную или при открытии приложения в нужную дату, всегда с вашим подтверждением.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '500' },
  iconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { color: Colors.textPrimary, fontSize: 17 },
  card: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  badgeOn: { backgroundColor: Colors.successGlow },
  badgeOff: { backgroundColor: Colors.surfaceLight },
  badgeText: { fontSize: 11, fontWeight: '500' },
  cardMeta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 10 },
  mini: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  miniIcon: { width: 15, height: 15 },
  cardLast: { color: Colors.textSecondary, fontSize: 11 },
  newBtn: {
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 4,
  },
  newBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  note: { color: Colors.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 16 },
  empty: {
    borderWidth: 0.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 12,
    padding: 20, marginBottom: 10,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 6 },
  emptyText: { color: Colors.textSecondary, fontSize: 12.5, lineHeight: 19 },
});
