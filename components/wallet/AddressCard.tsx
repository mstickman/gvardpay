import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../constants/colors';

interface AddressCardProps {
  address: string;
  onCopied?: () => void;
  /** Сразу показывать QR (например, на экране «Получить»). */
  defaultShowQr?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({ address, onCopied, defaultShowQr = false }) => {
  const [showQr, setShowQr] = useState(defaultShowQr);
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '—';

  const handleCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    onCopied?.();
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.label}>Ваш адрес</Text>
        <TouchableOpacity onPress={() => setShowQr((v) => !v)} activeOpacity={0.7}>
          <Text style={styles.qrLink}>{showQr ? 'Скрыть QR' : 'QR-код'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.address}>{shortAddress}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
          <Text style={styles.copyIcon}>⧉</Text>
        </TouchableOpacity>
      </View>

      {showQr && address ? (
        <View style={styles.qrWrap}>
          <View style={styles.qrBox}>
            <QRCode value={address} size={120} color={Colors.background} backgroundColor="#FFFFFF" />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    marginBottom: 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  qrLink: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  address: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  qrWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  qrBox: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
});
