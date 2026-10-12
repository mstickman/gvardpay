/**
 * Wallet state management (Zustand)
 */
import { create } from 'zustand';
import * as walletService from '../services/solana/wallet';
import * as tokenService from '../services/solana/tokens';

interface WalletState {
  // State
  publicKey: string | null;
  isConnected: boolean;
  isLoading: boolean;
  solBalance: number;
  tokenBalances: tokenService.TokenBalance[];
  transactions: tokenService.TransactionRecord[];
  error: string | null;

  // Actions
  createWallet: () => Promise<void>;
  importWallet: (secretKey: string) => Promise<void>;
  importWalletFromMnemonic: (mnemonic: string) => Promise<void>;
  loadWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  publicKey: null,
  isConnected: false,
  isLoading: false,
  solBalance: 0,
  tokenBalances: [],
  transactions: [],
  error: null,

  createWallet: async () => {
    try {
      set({ isLoading: true, error: null });
      const wallet = await walletService.generateWallet();
      set({
        publicKey: wallet.publicKey,
        isConnected: true,
        isLoading: false,
      });
      // Auto-refresh balances
      get().refreshBalances();
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  importWallet: async (secretKey: string) => {
    try {
      set({ isLoading: true, error: null });
      const wallet = await walletService.importWalletFromSecret(secretKey);
      set({
        publicKey: wallet.publicKey,
        isConnected: true,
        isLoading: false,
      });
      get().refreshBalances();
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  importWalletFromMnemonic: async (mnemonic: string) => {
    try {
      set({ isLoading: true, error: null });
      const wallet = await walletService.importWalletFromMnemonic(mnemonic);
      set({
        publicKey: wallet.publicKey,
        isConnected: true,
        isLoading: false,
      });
      get().refreshBalances();
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  loadWallet: async () => {
    try {
      set({ isLoading: true });
      const wallet = await walletService.loadStoredWallet();
      if (wallet) {
        set({
          publicKey: wallet.publicKey,
          isConnected: true,
          isLoading: false,
        });
        get().refreshBalances();
        get().refreshTransactions();
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  refreshBalances: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    try {
      const [solBalance, tokenBalances] = await Promise.all([
        tokenService.getSolBalance(publicKey),
        tokenService.getTokenBalances(publicKey),
      ]);
      set({ solBalance, tokenBalances });
    } catch (error: any) {
      console.error('Error refreshing balances:', error);
    }
  },

  refreshTransactions: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    try {
      const transactions = await tokenService.getTransactionHistory(publicKey);
      set({ transactions });
    } catch (error: any) {
      console.error('Error refreshing transactions:', error);
    }
  },

  disconnect: async () => {
    await walletService.deleteWallet();
    set({
      publicKey: null,
      isConnected: false,
      solBalance: 0,
      tokenBalances: [],
      transactions: [],
    });
  },

  clearError: () => set({ error: null }),
}));
