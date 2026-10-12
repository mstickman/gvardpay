import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { ICONS } from '../../constants/icons';
import { formatUSD } from '../../utils/format';

interface SendSuccessScreenProps {
  amount: number;
  token: string;
  timestamp: number;
  solPriceAtSend?: number; // курс SOL/USD на момент отправки — показываем только для токена SOL
  onDone: () => void;
}

export const SendSuccessScreen: React.FC<SendSuccessScreenProps> = ({
  amount,
  token,
  timestamp,
  solPriceAtSend,
  onDone,
}) => {
  const time = new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={ICONS.sendSuccess} style={styles.icon} resizeMode="contain" />
        <Text style={styles.title}>Перевод успешен</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Сумма</Text>
            <Text style={styles.value}>{amount} {token}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Время</Text>
            <Text style={styles.value}>{time}</Text>
          </View>
          {token === 'SOL' && solPriceAtSend !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Курс на момент отправки</Text>
              <Text style={styles.value}>1 SOL ≈ {formatUSD(solPriceAtSend)}</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={onDone}>
        <Text style={styles.btnText}>На главный экран</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 72, height: 72, marginBottom: 20 },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '500', marginBottom: 28 },
  card: {
    width: '100%', backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 12, padding: 16,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  label: { color: Colors.textSecondary, fontSize: 12.5 },
  value: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '500' },
});
