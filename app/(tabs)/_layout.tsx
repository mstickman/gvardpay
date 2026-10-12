import React from 'react';
import { Image } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ICONS } from '../../constants/icons';
import { useAutoRun } from '../../services/workflows/useAutoRun';

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <Image
    source={source}
    style={{ width: 22, height: 22, opacity: focused ? 1 : 0.55 }}
    resizeMode="contain"
  />
);

export default function TabsLayout() {
  useAutoRun();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Главная',
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.tabHome} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Платежи',
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.tabSend} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="automation"
        options={{
          title: 'Сценарии',
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.tabAutomation} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.tabSettings} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
