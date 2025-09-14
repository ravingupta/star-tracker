import { Tabs } from 'expo-router';
import React from 'react';

import ObserveHeader from '@/components/ObserveHeader';
import { HapticTab } from '@/components/ui/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/ui/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerBackground: () => <ThemedView style={{ flex: 1, backgroundColor: Colors[colorScheme ?? 'dark'].background }} />
      }}>
      <Tabs.Screen
        name="observe"
        options={{
          title: 'Observe',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="scope" color={color} />,
          header: () => <ObserveHeader />,
        }}
      />
      <Tabs.Screen
        name="targets"
        options={{
          title: 'Targets',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alignment"
        options={{
          title: 'Alignment',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.north.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
