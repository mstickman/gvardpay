/**
 * Settings state management
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { switchNetwork, setLocalRpcOverride } from '../services/solana/connection';
import { NetworkName, SOLANA_RPC } from '../constants/config';

const SETTINGS_KEY = 'payfinity_settings';

interface SettingsState {
  network: NetworkName;
  /** Адрес локального узла (solana-test-validator). Стартовое значение берётся из .env. */
  localRpcUrl: string;
  language: 'ru' | 'en';
  biometricEnabled: boolean;
  notificationsEnabled: boolean;

  loadSettings: () => Promise<void>;
  setNetwork: (network: NetworkName) => Promise<void>;
  setLocalRpcUrl: (url: string) => Promise<void>;
  resetLocalRpcUrl: () => Promise<void>;
  setLanguage: (language: 'ru' | 'en') => Promise<void>;
  setBiometric: (enabled: boolean) => Promise<void>;
  setNotifications: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  network: 'devnet',
  localRpcUrl: SOLANA_RPC.localnet,
  language: 'ru',
  biometricEnabled: false,
  notificationsEnabled: true,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set(settings);
        // адрес узла применяем до выбора сети, чтобы первое подключение сразу шло на него
        if (settings.localRpcUrl) setLocalRpcOverride(settings.localRpcUrl);
        switchNetwork(settings.network);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  setNetwork: async (network) => {
    switchNetwork(network);
    set({ network });
    await saveSettings(get());
  },

  setLocalRpcUrl: async (url) => {
    setLocalRpcOverride(url);
    set({ localRpcUrl: url });
    await saveSettings(get());
  },

  resetLocalRpcUrl: async () => {
    setLocalRpcOverride(null);
    set({ localRpcUrl: SOLANA_RPC.localnet });
    await saveSettings(get());
  },

  setLanguage: async (language) => {
    set({ language });
    await saveSettings(get());
  },

  setBiometric: async (enabled) => {
    set({ biometricEnabled: enabled });
    await saveSettings(get());
  },

  setNotifications: async (enabled) => {
    set({ notificationsEnabled: enabled });
    await saveSettings(get());
  },
}));

const saveSettings = async (state: SettingsState) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({
      network: state.network,
      localRpcUrl: state.localRpcUrl,
      language: state.language,
      biometricEnabled: state.biometricEnabled,
      notificationsEnabled: state.notificationsEnabled,
    }));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};
