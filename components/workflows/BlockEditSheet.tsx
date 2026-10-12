import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BLOCKS } from '../../services/workflows/blocks';
import {
  CalcConfig, ComplianceConfig, NotifyConfig, PaymentConfig, TriggerConfig, WorkflowBlock,
} from '../../services/workflows/types';
import { QrScannerModal } from '../wallet/QrScannerModal';

interface Props {
  visible: boolean;
  block: WorkflowBlock | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

const num = (s: string): number => parseFloat(s.replace(',', '.').replace(/\s/g, ''));

const Pills = <T extends string>({
  options, value, onChange,
}: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
  <View style={styles.pillRow}>
    {options.map((o) => (
      <TouchableOpacity
        key={o.id}
        style={[styles.pill, value === o.id && styles.pillOn]}
        onPress={() => onChange(o.id)}
      >
        <Text style={[styles.pillText, value === o.id && styles.pillTextOn]}>{o.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const BlockEditSheet: React.FC<Props> = ({
  visible, block, canMoveUp, canMoveDown, onClose, onSave, onDelete, onMove,
}) => {
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    if (!block) return;
    setError('');
    const c: any = block.config;
    setDraft({
      ...c,
      dayOfMonth: c.dayOfMonth !== undefined ? String(c.dayOfMonth) : '',
      hour: c.hour !== undefined ? String(c.hour) : '',
      amount: c.amount !== undefined ? String(c.amount) : '',
      maxUsd: c.maxUsd !== undefined ? String(c.maxUsd) : '',
    });
  }, [block, visible]);

  if (!block) return null;
  const meta = BLOCKS[block.type];
  const set = (k: string, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    switch (block.type) {
      case 'trigger': {
        const day = Math.round(num(draft.dayOfMonth));
        const hour = Math.round(num(draft.hour));
        if (draft.mode === 'monthly') {
          if (!(day >= 1 && day <= 28)) return setError('День месяца: от 1 до 28');
          if (!(hour >= 0 && hour <= 23)) return setError('Час: от 0 до 23');
        }
        const cfg: TriggerConfig = { mode: draft.mode, dayOfMonth: day >= 1 ? day : 5, hour: hour >= 0 ? hour : 10 };
        return onSave(cfg);
      }
      case 'calc': {
        const amount = num(draft.amount);
        if (!(amount > 0)) return setError('Введите сумму больше нуля');
        const cfg: CalcConfig = { amount, currency: draft.currency };
        return onSave(cfg);
      }
      case 'compliance': {
        const maxUsd = num(draft.maxUsd);
        if (!(maxUsd > 0)) return setError('Введите лимит больше нуля');
        const cfg: ComplianceConfig = { maxUsd, allowedAddresses: String(draft.allowedAddresses || '') };
        return onSave(cfg);
      }
      case 'payment': {
        const amount = draft.amount ? num(draft.amount) : 0;
        const cfg: PaymentConfig = {
          token: draft.token,
          recipient: String(draft.recipient || '').trim(),
          amount: amount > 0 ? amount : 0,
        };
        return onSave(cfg);
      }
      case 'notify': {
        const cfg: NotifyConfig = { message: String(draft.message || '') };
        return onSave(cfg);
      }
      case 'ledger':
        return onSave({});
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{meta.label}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {block.type === 'trigger' && (
              <>
                <Text style={styles.label}>Когда запускать</Text>
                <Pills
                  options={[{ id: 'monthly', label: 'Каждый месяц' }, { id: 'manual', label: 'Только вручную' }]}
                  value={draft.mode}
                  onChange={(v) => set('mode', v)}
                />
                {draft.mode === 'monthly' && (
                  <>
                    <Text style={styles.label}>День месяца (1–28)</Text>
                    <View style={styles.field}>
                      <TextInput style={styles.input} value={draft.dayOfMonth} onChangeText={(v) => set('dayOfMonth', v)} keyboardType="number-pad" />
                    </View>
                    <Text style={styles.label}>Час (0–23)</Text>
                    <View style={styles.field}>
                      <TextInput style={styles.input} value={draft.hour} onChangeText={(v) => set('hour', v)} keyboardType="number-pad" />
                    </View>
                    <Text style={styles.hint}>Сценарий предложит выполниться при открытии приложения в этот день, после указанного часа.</Text>
                  </>
                )}
              </>
            )}

            {block.type === 'calc' && (
              <>
                <Text style={styles.label}>Валюта суммы</Text>
                <Pills
                  options={[{ id: 'USD', label: 'USD' }, { id: 'KZT', label: '₸ KZT' }, { id: 'SOL', label: 'SOL' }]}
                  value={draft.currency}
                  onChange={(v) => set('currency', v)}
                />
                <Text style={styles.label}>Сумма</Text>
                <View style={styles.field}>
                  <TextInput style={styles.input} value={draft.amount} onChangeText={(v) => set('amount', v)} keyboardType="decimal-pad" />
                </View>
                <Text style={styles.hint}>Тенге и доллары пересчитываются по реальному курсу на момент запуска.</Text>
              </>
            )}

            {block.type === 'compliance' && (
              <>
                <Text style={styles.label}>Лимит платежа, USD</Text>
                <View style={styles.field}>
                  <TextInput style={styles.input} value={draft.maxUsd} onChangeText={(v) => set('maxUsd', v)} keyboardType="decimal-pad" />
                </View>
                <Text style={styles.label}>Разрешённые адреса (необязательно)</Text>
                <View style={styles.field}>
                  <TextInput
                    style={[styles.input, { minHeight: 64 }]}
                    value={draft.allowedAddresses}
                    onChangeText={(v) => set('allowedAddresses', v)}
                    placeholder="По одному адресу в строке"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                  />
                </View>
                <Text style={styles.hint}>
                  Блок проверяет следующий за ним платёж: адрес корректен, входит в список (если список не пуст), сумма не выше лимита. Проверки по санкционным спискам здесь нет.
                </Text>
              </>
            )}

            {block.type === 'payment' && (
              <>
                <Text style={styles.label}>Токен</Text>
                <Pills
                  options={[{ id: 'SOL', label: 'SOL' }, { id: 'USDC', label: 'USDC' }, { id: 'USDT', label: 'USDT' }]}
                  value={draft.token}
                  onChange={(v) => set('token', v)}
                />
                <Text style={styles.label}>Адрес получателя</Text>
                <View style={styles.field}>
                  <TextInput
                    style={styles.input}
                    value={draft.recipient}
                    onChangeText={(v) => set('recipient', v)}
                    placeholder="Вставьте адрес"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setScanOpen(true)} accessibilityLabel="Сканировать QR">
                    <Text style={styles.scan}>▦</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Запасная сумма (в токене)</Text>
                <View style={styles.field}>
                  <TextInput style={styles.input} value={draft.amount} onChangeText={(v) => set('amount', v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textSecondary} />
                </View>
                <Text style={styles.hint}>Используется, только если в цепочке нет блока расчёта. Иначе сумму задаёт блок расчёта.</Text>
              </>
            )}

            {block.type === 'notify' && (
              <>
                <Text style={styles.label}>Текст уведомления</Text>
                <View style={styles.field}>
                  <TextInput style={[styles.input, { minHeight: 64 }]} value={draft.message} onChangeText={(v) => set('message', v)} multiline />
                </View>
                <Text style={styles.hint}>Уведомление показывается на этом телефоне после запуска. Отправки другим людям нет: для этого нужен сервер.</Text>
              </>
            )}

            {block.type === 'ledger' && (
              <Text style={styles.hint}>
                Запуск попадает в журнал вместе со всеми шагами и подписью транзакции. PDF-подтверждение можно открыть из журнала.
              </Text>
            )}

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
              <Text style={styles.saveText}>Сохранить</Text>
            </TouchableOpacity>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actBtn, !canMoveUp && styles.actOff]} disabled={!canMoveUp} onPress={() => onMove(-1)}>
                <Text style={styles.actText}>↑ Выше</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actBtn, !canMoveDown && styles.actOff]} disabled={!canMoveDown} onPress={() => onMove(1)}>
                <Text style={styles.actText}>↓ Ниже</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actBtn} onPress={onDelete}>
                <Text style={[styles.actText, { color: Colors.error }]}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <QrScannerModal visible={scanOpen} onClose={() => setScanOpen(false)} onScanned={(v) => set('recipient', v)} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    backgroundColor: Colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderWidth: 0.5, borderColor: Colors.border, padding: 18, maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '500' },
  close: { color: Colors.accent, fontSize: 13, fontWeight: '500' },
  label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 16, marginBottom: 8 },
  hint: { color: Colors.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 10 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  pillOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { color: Colors.textSecondary, fontSize: 12.5, fontWeight: '500' },
  pillTextOn: { color: '#FFFFFF' },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11,
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 13.5 },
  scan: { fontSize: 17, color: Colors.textSecondary },
  error: { color: Colors.error, fontSize: 12.5, marginTop: 12 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 6 },
  actBtn: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  actOff: { opacity: 0.4 },
  actText: { color: Colors.textPrimary, fontSize: 12.5, fontWeight: '500' },
});
