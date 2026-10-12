/**
 * Application configuration
 */

// Локальный валидатор слушает на конкретном IP машины, на которой запущен
// `solana-test-validator` — этот IP разный на каждой машине и меняется при
// смене сети, поэтому берём его из .env, а не хардкодим. Один раз узнать:
// `ipconfig getifaddr en0` (Mac, Wi-Fi) и положить в .env как
// EXPO_PUBLIC_LOCAL_RPC_URL=http://<тот-IP>:8899
// Для iOS-симулятора (не физический телефон) подходит и localhost — он
// делит сеть с самим Mac.
const LOCAL_RPC_FALLBACK = 'http://127.0.0.1:8899';

export const SOLANA_RPC = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
  localnet: process.env.EXPO_PUBLIC_LOCAL_RPC_URL || LOCAL_RPC_FALLBACK,
} as const;

export type NetworkName = 'devnet' | 'mainnet' | 'localnet';

export const APP_CONFIG = {
  name: 'GvardPay',
  version: '1.0.0',
  defaultNetwork: 'devnet' as NetworkName,
  transactionTimeoutMs: 30000,
  maxRecentTransactions: 50,
  confirmationCommitment: 'confirmed' as const,
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    mono: 'monospace',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
    hero: 48,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;
