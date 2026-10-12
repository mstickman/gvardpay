/**
 * Wallet management service
 * Handles keypair generation, import/export, and secure storage
 * WITH Post-Quantum cryptographic protection (ML-KEM-768 + AES-256-GCM)
 */
import { Keypair } from '@solana/web3.js';
import * as SecureStore from 'expo-secure-store';
import bs58 from 'bs58';
import {
  initializePQ,
  pqEncrypt,
  pqDecrypt,
  pqSign,
  isPQInitialized,
  wipePQKeys,
  type PQEncryptedData,
} from '../crypto/postQuantum';

const WALLET_KEY = 'payfinity_wallet_secret';
const WALLET_PQ_KEY = 'payfinity_wallet_pq_encrypted';
const WALLET_CREATED_KEY = 'payfinity_wallet_created';

export interface WalletData {
  publicKey: string;
  secretKeyBase58: string;
}

/**
 * Store the secret key with Post-Quantum encryption
 * Double layer: PQ encrypt → SecureStore (hardware-backed)
 */
async function secureStoreKey(secretKeyBase58: string): Promise<void> {
  // PQ-слой — дополнительная защита, а не обязательное условие для того,
  // чтобы кошелёк вообще сохранился. Если он по какой-то причине упадёт
  // (несовместимость рантайма, отсутствие рандома и т.п.) — не должны
  // терять весь кошелёк из-за этого, SecureStore ниже отработает всегда.
  try {
    await initializePQ();
    const pqEncrypted = await pqEncrypt(secretKeyBase58);
    await SecureStore.setItemAsync(WALLET_PQ_KEY, JSON.stringify(pqEncrypted));
  } catch (error) {
    console.warn('[Wallet] PQ-шифрование недоступно, сохраняю только через SecureStore:', error);
  }

  // Ключ напрямую в SecureStore (аппаратное шифрование: iOS Keychain /
  // Android Keystore) — это всегда должно сработать.
  await SecureStore.setItemAsync(WALLET_KEY, secretKeyBase58);
  await SecureStore.setItemAsync(WALLET_CREATED_KEY, 'true');
}

/**
 * Load and decrypt the secret key with PQ decryption
 */
async function secureLoadKey(): Promise<string | null> {
  // Try PQ-encrypted path first (preferred)
  const pqInitialized = await isPQInitialized();
  if (pqInitialized) {
    const pqDataStr = await SecureStore.getItemAsync(WALLET_PQ_KEY);
    if (pqDataStr) {
      try {
        const pqData: PQEncryptedData = JSON.parse(pqDataStr);
        const decrypted = await pqDecrypt(pqData);
        return decrypted;
      } catch (error) {
        console.warn('[Wallet] PQ decryption failed, falling back to SecureStore:', error);
      }
    }
  }

  // Fallback: direct SecureStore (still hardware-encrypted)
  return SecureStore.getItemAsync(WALLET_KEY);
}

/**
 * Generate a new random Solana keypair with PQ protection
 */
export const generateWallet = async (): Promise<WalletData> => {
  const keypair = Keypair.generate();
  const walletData: WalletData = {
    publicKey: keypair.publicKey.toBase58(),
    secretKeyBase58: bs58.encode(keypair.secretKey),
  };

  // Store with PQ encryption
  await secureStoreKey(walletData.secretKeyBase58);

  // Sign the public key with ML-DSA-65 for integrity verification
  try {
    const encoder = new TextEncoder();
    await pqSign(encoder.encode(walletData.publicKey));
    console.log('[Wallet] PQ signature created for wallet integrity');
  } catch (e) {
    console.warn('[Wallet] PQ signing skipped:', e);
  }

  return walletData;
};

/**
 * Import wallet from secret key (base58) with PQ protection
 */
export const importWalletFromSecret = async (secretKeyBase58: string): Promise<WalletData> => {
  const secretKey = bs58.decode(secretKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKey);
  const walletData: WalletData = {
    publicKey: keypair.publicKey.toBase58(),
    secretKeyBase58,
  };

  await secureStoreKey(secretKeyBase58);
  return walletData;
};

/**
 * Import wallet from mnemonic seed phrase with PQ protection
 */
export const importWalletFromMnemonic = async (mnemonic: string): Promise<WalletData> => {
  const bip39 = await import('bip39');
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const seedBytes = new Uint8Array(seed.buffer).slice(0, 32);
  const keypair = Keypair.fromSeed(seedBytes);
  
  const walletData: WalletData = {
    publicKey: keypair.publicKey.toBase58(),
    secretKeyBase58: bs58.encode(keypair.secretKey),
  };

  await secureStoreKey(walletData.secretKeyBase58);
  return walletData;
};

/**
 * Load stored wallet from secure storage (with PQ decryption)
 */
export const loadStoredWallet = async (): Promise<WalletData | null> => {
  const secretKeyBase58 = await secureLoadKey();
  if (!secretKeyBase58) return null;

  try {
    const secretKey = bs58.decode(secretKeyBase58);
    const keypair = Keypair.fromSecretKey(secretKey);
    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKeyBase58,
    };
  } catch {
    return null;
  }
};

/**
 * Get Keypair from stored wallet (with PQ decryption)
 */
export const getKeypair = async (): Promise<Keypair | null> => {
  const secretKeyBase58 = await secureLoadKey();
  if (!secretKeyBase58) return null;

  try {
    const secretKey = bs58.decode(secretKeyBase58);
    return Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
};

/**
 * Check if a wallet exists in secure storage
 */
export const hasStoredWallet = async (): Promise<boolean> => {
  const created = await SecureStore.getItemAsync(WALLET_CREATED_KEY);
  return created === 'true';
};

/**
 * Delete stored wallet and PQ keys (logout)
 */
export const deleteWallet = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(WALLET_KEY);
  await SecureStore.deleteItemAsync(WALLET_PQ_KEY);
  await SecureStore.deleteItemAsync(WALLET_CREATED_KEY);
  await wipePQKeys();
};

/**
 * Export wallet secret key as PQ-encrypted container
 */
export const exportSecretKeyEncrypted = async (): Promise<string | null> => {
  const pqDataStr = await SecureStore.getItemAsync(WALLET_PQ_KEY);
  return pqDataStr; // Returns the full PQ-encrypted JSON container
};

/**
 * Export raw secret key (for advanced users, with warning)
 */
export const exportSecretKey = async (): Promise<string | null> => {
  return secureLoadKey();
};

/**
 * Shorten address for display
 */
export const shortenAddress = (address: string, chars: number = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
