import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useWalletStore } from '../../stores/walletStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { BalanceCard } from '../../components/wallet/BalanceCard';
import { ReceiveSheet } from '../../components/wallet/ReceiveSheet';
import { TransactionItem } from '../../components/wallet/TransactionItem';
import { PQBadge } from '../../components/security/PQBadge';
import { NetworkName } from '../../constants/config';
import { getSolPriceUsd } from '../../services/price';
import { Colors } from '../../constants/colors';

const NETWORK_LABELS: Record<NetworkName, string> = { devnet: 'Devnet', localnet: 'Localnet', mainnet: 'Mainnet' };
const NETWORK_COLORS: Record<NetworkName, string> = { devnet: '#00E68A', localnet: '#FFB800', mainnet: '#00D9FF' };

export default function DashboardScreen() {
  const { solBalance, tokenBalances, publicKey, transactions, refreshBalances, refreshTransactions } = useWalletStore();
  const { network } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [solPrice, setSolPrice] = useState(0);
  const [currency, setCurrency] = useState<'USD' | 'SOL'>('USD');
  const [receiveOpen, setReceiveOpen] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshBalances(), refreshTransactions(), getSolPriceUsd().then(setSolPrice)]);
    setRefreshing(false);
  };

  useEffect(() => {
    refreshBalances();
    refreshTransactions();
    getSolPriceUsd().then(setSolPrice);
  }, []);

  const usdcBalance = tokenBalances.find(t => t.symbol === 'USDC')?.uiBalance || '0';
  const usdtBalance = tokenBalances.find(t => t.symbol === 'USDT')?.uiBalance || '0';
  // SOL сам по себе не доллар — переводим по актуальному курсу, а не
  // показываем баланс USDC под видом "общего баланса", как было раньше.
  const solUsdValue = solBalance * solPrice;
  const totalUsd = solUsdValue + parseFloat(usdcBalance || '0') + parseFloat(usdtBalance || '0');

  const handleSend = () => {
    router.push('/(tabs)/payments');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      <View style={styles.header}>
        <PQBadge />
        <View style={[styles.networkBadge, { borderColor: NETWORK_COLORS[network] }]}>
          <View style={[styles.dot, { backgroundColor: NETWORK_COLORS[network] }]} />
          <Text style={[styles.networkText, { color: NETWORK_COLORS[network] }]}>
            {NETWORK_LABELS[network]}
          </Text>
        </View>
      </View>

      <View style={styles.balanceSection}>
        <BalanceCard
          solBalance={solBalance}
          solUsdValue={solUsdValue}
          solPrice={solPrice}
          totalUsd={totalUsd}
          publicKey={publicKey || ''}
          currency={currency}
          onCurrencyChange={setCurrency}
          onAddressCopied={() => Alert.alert('Скопировано', 'Адрес скопирован в буфер обмена')}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionSend]} onPress={handleSend} activeOpacity={0.85}>
          <Text style={styles.actionIcon}>↑</Text>
          <Text style={styles.actionText}>Отправить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionReceive]} onPress={() => setReceiveOpen(true)} activeOpacity={0.85}>
          <Text style={styles.actionIcon}>↓</Text>
          <Text style={styles.actionText}>Получить</Text>
        </TouchableOpacity>
      </View>

      <ReceiveSheet
        visible={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        address={publicKey || ''}
        networkLabel={NETWORK_LABELS[network]}
      />

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Последние транзакции</Text>
        {transactions && transactions.length > 0 ? (
          transactions.map((tx, idx) => (
            <TransactionItem key={idx} {...tx} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Транзакций пока нет</Text>
            <Text style={styles.emptyHint}>
              {network !== 'mainnet' ? 'Пополнить баланс можно через дев-консоль' : 'Отправьте или получите средства'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  actionSend: {
    flex: 3,
    backgroundColor: Colors.accent,
  },
  actionReceive: {
    flex: 2,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '500',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyHint: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
