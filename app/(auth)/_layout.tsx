import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors?.background || '#0A0E27' },
      }}
    />
  );
}
