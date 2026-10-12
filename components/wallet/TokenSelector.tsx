import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type TokenSymbol = 'USDC' | 'USDT' | 'SOL';

interface TokenSelectorProps {
  selected: TokenSymbol;
  onSelect: (token: TokenSymbol) => void;
}

const TOKENS: { symbol: TokenSymbol; icon: string; color: string }[] = [
  { symbol: 'USDC', icon: '💵', color: '#2775CA' },
  { symbol: 'USDT', icon: '💲', color: '#26A17B' },
  { symbol: 'SOL', icon: '◎', color: '#9945FF' },
];

export const TokenSelector: React.FC<TokenSelectorProps> = ({ selected, onSelect }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {TOKENS.map((token) => {
        const isSelected = selected === token.symbol;

        const content = (
          <View style={[styles.chipInner, !isSelected && styles.chipUnselected]}>
            <Text style={styles.icon}>{token.icon}</Text>
            <Text style={[styles.symbol, { color: isSelected ? '#FFFFFF' : '#8A8FAD' }]}>
              {token.symbol}
            </Text>
          </View>
        );

        return (
          <TouchableOpacity
            key={token.symbol}
            onPress={() => onSelect(token.symbol)}
            style={styles.chipWrapper}
          >
            {isSelected ? (
              <LinearGradient
                colors={['#7B61FF', '#00D9FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chipGradient}
              >
                {content}
              </LinearGradient>
            ) : (
              content
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  chipWrapper: {
    marginRight: 12,
  },
  chipGradient: {
    borderRadius: 9999,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chipUnselected: {
    borderWidth: 1,
    borderColor: '#1E2448',
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  symbol: {
    fontSize: 15,
    fontWeight: '600',
  }
});
