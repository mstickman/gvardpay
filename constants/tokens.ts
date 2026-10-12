/**
 * Solana Token Mint addresses and metadata
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  icon: string;
  color: string;
  coingeckoId?: string;
}

// Devnet USDC (Circle's official devnet mint)
export const USDC_DEVNET: TokenInfo = {
  symbol: 'USDC',
  name: 'USD Coin',
  mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  decimals: 6,
  icon: '💵',
  color: '#2775CA',
  coingeckoId: 'usd-coin',
};

// Devnet USDT
export const USDT_DEVNET: TokenInfo = {
  symbol: 'USDT',
  name: 'Tether USD',
  mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  decimals: 6,
  icon: '💲',
  color: '#26A17B',
  coingeckoId: 'tether',
};

// Mainnet USDC
export const USDC_MAINNET: TokenInfo = {
  symbol: 'USDC',
  name: 'USD Coin',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  decimals: 6,
  icon: '💵',
  color: '#2775CA',
  coingeckoId: 'usd-coin',
};

// Mainnet USDT
export const USDT_MAINNET: TokenInfo = {
  symbol: 'USDT',
  name: 'Tether USD',
  mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  decimals: 6,
  icon: '💲',
  color: '#26A17B',
  coingeckoId: 'tether',
};

// SOL (native)
export const SOL_TOKEN: TokenInfo = {
  symbol: 'SOL',
  name: 'Solana',
  mint: 'So11111111111111111111111111111111111111112',
  decimals: 9,
  icon: '◎',
  color: '#9945FF',
  coingeckoId: 'solana',
};

export const DEVNET_TOKENS: TokenInfo[] = [SOL_TOKEN, USDC_DEVNET, USDT_DEVNET];
export const MAINNET_TOKENS: TokenInfo[] = [SOL_TOKEN, USDC_MAINNET, USDT_MAINNET];
// На свежем локальном валидаторе никакого готового USDC/USDT нет — это
// пустой леджер, SOL там появляется через airdrop (dev-консоль, команда add).
export const LOCALNET_TOKENS: TokenInfo[] = [SOL_TOKEN];

export const TOKENS_BY_NETWORK: Record<'devnet' | 'mainnet' | 'localnet', TokenInfo[]> = {
  devnet: DEVNET_TOKENS,
  mainnet: MAINNET_TOKENS,
  localnet: LOCALNET_TOKENS,
};

export const getTokenByMint = (
  mint: string,
  network: 'devnet' | 'mainnet' | 'localnet',
): TokenInfo | undefined => {
  return TOKENS_BY_NETWORK[network].find(t => t.mint === mint);
};
