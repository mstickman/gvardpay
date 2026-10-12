import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { formatTimestamp } from '../../utils/format';
import { Colors } from '../../constants/colors';
import { ICONS } from '../../constants/icons';
import { generateAndShareContract } from '../../services/contractPdf';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWalletStore } from '../../stores/walletStore';
import { TransactionRecord } from '../../services/solana/tokens';

type TransactionItemProps = TransactionRecord;

export const TransactionItem: React.FC<TransactionItemProps> = (tx) => {
  const { signature, timestamp, type, amount, token, status } = tx;
  const [generating, setGenerating] = useState(false);
  const { network } = useSettingsStore();
  const { publicKey } = useWalletStore();

  const isReceive = type === 'receive' || type === 'mint';
  const icon = isReceive ? '↓' : '↑';
  const iconColor = isReceive ? Colors.success : Colors.textPrimary;
  const statusColor = status === 'confirmed' ? Colors.success : status === 'failed' ? Colors.error : '#FFB800';
  const shortSig = `${signature.slice(0, 4)}...${signature.slice(-4)}`;

  const handleContract = async () => {
    setGenerating(true);
    try {
      await generateAndShareContract(tx, network, publicKey || '');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось сформировать документ');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}22` }]}>
          <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
        </View>
        <View style={styles.middle}>
          <Text style={styles.typeText}>{type}</Text>
          <Text style={styles.sigText}>{shortSig}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amountText}>{isReceive ? '+' : '-'}{amount} {token}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.timeText}>{formatTimestamp(timestamp)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.contractBtn, generating && styles.contractBtnDisabled]}
        onPress={handleContract}
        disabled={generating}
        activeOpacity={0.7}
      >
        <Image source={ICONS.contract} style={styles.contractIcon} resizeMode="contain" />
        <Text style={styles.contractText}>{generating ? 'Формирую PDF...' : 'Смарт-контракт (PDF)'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  icon: { fontSize: 15, fontWeight: '500' },
  middle: { flex: 1 },
  typeText: { color: Colors.textPrimary, fontSize: 13.5, fontWeight: '500', textTransform: 'capitalize' },
  sigText: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amountText: { color: Colors.textPrimary, fontSize: 13.5, fontWeight: '500' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  timeText: { color: Colors.textSecondary, fontSize: 11 },
  contractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 10,
  },
  contractBtnDisabled: { opacity: 0.55 },
  contractIcon: { width: 18, height: 18 },
  contractText: { color: Colors.accent, fontSize: 13, fontWeight: '500' },
});
