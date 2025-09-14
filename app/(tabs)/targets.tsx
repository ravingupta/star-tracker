
import ManualTargetInput from '@/components/ManualTargetInput';
import TargetListItem from '@/components/TargetListItem';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { CATALOG } from '@/constants/catalog';
import { useTargetContext } from '@/context/target-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Alert, ScrollView } from 'react-native';

export default function TargetsScreen() {
  const { selectedTarget, setSelectedTarget, setManual, setUseManual } = useTargetContext();
  const tint = useThemeColor({}, "tint");

  function handleUseManual(ra: number, dec: number) {
    setManual(ra, dec);
    setUseManual(true);
    Alert.alert("Manual Target Set", `RA: ${ra}h, Dec: ${dec}°`);
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <ThemedText style={{ opacity: 0.8, marginBottom: 12, textAlign: 'center' }}>
          Tap an object to set it as your current target.
        </ThemedText>

        {CATALOG.map((item) => (
          <TargetListItem
            key={item.name}
            item={item}
            selected={selectedTarget?.name === item.name}
            onPress={() => setSelectedTarget(item)}
          />
        ))}

        {/* Manual Target Input */}
        <ManualTargetInput onUseManual={handleUseManual} />
      </ScrollView>
    </ThemedView>
  );
}