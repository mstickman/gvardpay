import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../stores/settingsStore';
import { useWalletStore } from '../stores/walletStore';
import { Colors } from '../constants/colors';
import { DebugConsole } from '../components/dev/DebugConsole';

// В публичной сборке консоль скрыта. Для демо с пополнением кошелька:
// EXPO_PUBLIC_DEBUG_CONSOLE=1 в .env перед сборкой (значение вшивается в билд).
const SHOW_DEBUG_CONSOLE = __DEV__ || process.env.EXPO_PUBLIC_DEBUG_CONSOLE === '1';

export default function RootLayout() {
  const { loadSettings } = useSettingsStore();
  const { loadWallet } = useWalletStore();

  useEffect(() => {
    loadSettings();
    loadWallet();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background || '#0A0E27' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      {SHOW_DEBUG_CONSOLE && <DebugConsole />}
    </>
  );
}
