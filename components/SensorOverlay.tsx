import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';

interface SensorOverlayProps {
  currentAlt: number;
  rollDeg: number;
  headingDeg: number;
  azOffset: number;
  altOffset: number;
}

export function SensorOverlay({
  currentAlt,
  rollDeg,
  headingDeg,
  azOffset,
  altOffset
}: SensorOverlayProps) {
  const iconColor = useThemeColor({}, "icon");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");

  return (
    <ThemedView style={{
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderColor: borderColor,
      backgroundColor: cardBgColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}>
      <ThemedText type="subtitle">Sensors (live)</ThemedText>
      <ThemedText>Pitch (Alt): {currentAlt.toFixed(2)}°</ThemedText>
      <ThemedText>Roll: {rollDeg.toFixed(2)}°</ThemedText>
      <ThemedText>Heading: {headingDeg.toFixed(2)}°</ThemedText>
      <ThemedText>
        Az offset: {azOffset.toFixed(2)}°  Alt offset: {altOffset.toFixed(2)}°
      </ThemedText>
    </ThemedView>
  );
}

export default SensorOverlay;