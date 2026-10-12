import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { AddressCard } from './AddressCard';
import { Colors } from '../../constants/colors';

interface ReceiveSheetProps {
  visible: boolean;
  onClose: () => void;
  address: string;
  networkLabel: string;
}

const STEPS = [
  'Покажите отправителю QR-код ниже или передайте ему адрес: нажмите на значок копирования и отправьте адрес в мессенджер.',
  'Отправитель открывает вкладку «Платежи», вставляет адрес (или сканирует QR-код кнопкой ▦) и вводит сумму.',
  'Перевод приходит за несколько секунд. Потяните главный экран вниз, чтобы обновить баланс: операция появится в истории.',
];

export const ReceiveSheet: React.FC<ReceiveSheetProps> = ({ visible, onClose, address, networkLabel }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Как получить платёж</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {STEPS.map((text, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{text}</Text>
              </View>
            ))}

            <View style={styles.note}>
              <Text style={styles.noteText}>
                Сейчас выбрана сеть {networkLabel}. Отправитель должен быть в той же сети: Devnet, Localnet и
                Mainnet — разные сети, и перевод из другой сети сюда не придёт. SOL и токены приходят на один и тот же адрес.
              </Text>
            </View>

            <AddressCard
              address={address}
              defaultShowQr
              onCopied={() => Alert.alert('Скопировано', 'Адрес скопирован в буфер обмена')}
            />

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneText}>Понятно</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 18,
    maxHeight: '88%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '500' },
  close: { color: Colors.accent, fontSize: 13, fontWeight: '500' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  stepNumText: { color: Colors.accent, fontSize: 12, fontWeight: '500' },
  stepText: { flex: 1, color: Colors.textPrimary, fontSize: 13, lineHeight: 19 },
  note: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  noteText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  doneBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 8 },
  doneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
});
