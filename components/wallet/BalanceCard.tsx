import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { formatUSD } from '../../utils/format';
import { Colors } from '../../constants/colors';
import { CurrencySwitch } from './CurrencySwitch';
import { AddressCard } from './AddressCard';

interface BalanceCardProps {
  solBalance: number;
  solUsdValue: number;
  solPrice: number;
  totalUsd: number;
  publicKey: string;
  currency: 'USD' | 'SOL';
  onCurrencyChange: (c: 'USD' | 'SOL') => void;
  onAddressCopied?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  solBalance,
  solUsdValue,
  solPrice,
  totalUsd,
  publicKey,
  currency,
  onCurrencyChange,
  onAddressCopied,
}) => {
  const headline = currency === 'USD' ? formatUSD(totalUsd) : `${solBalance} SOL`;
  const sub = currency === 'USD' ? `≈ ${solBalance} SOL` : `≈ ${formatUSD(solUsdValue)}`;
  const rateLine = solPrice > 0 ? `Курс: 1 SOL ≈ ${formatUSD(solPrice)}` : 'Курс загружается...';

  return (
    <View style={styles.container}>
      <CurrencySwitch
        options={['USD', 'SOL']}
        value={currency}
        onChange={(v) => onCurrencyChange(v as 'USD' | 'SOL')}
      />

      <Text style={styles.totalBalance}>{headline}</Text>
      <Text style={styles.sub}>{sub}</Text>
      <Text style={styles.rate}>{rateLine}</Text>

      <AddressCard address={publicKey} onCopied={onAddressCopied} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  totalBalance: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '500',
    marginTop: 14,
    letterSpacing: -0.4,
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rate: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 14,
  },
});
