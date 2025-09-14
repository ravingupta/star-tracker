import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';

interface AltAzGuidanceProps {
  targetAlt: number | null;
  targetAz: number | null;
  deltaAlt: number;
  deltaAz: number;
}

export function AltAzGuidance({ targetAlt, targetAz, deltaAlt, deltaAz }: AltAzGuidanceProps) {
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
      <ThemedText type="subtitle">Target Guidance</ThemedText>
      {targetAlt === null || targetAz === null ? (
        <ThemedText>Target not computed (need GPS and selection)</ThemedText>
      ) : (
        <>
          <ThemedText>Target Alt: {targetAlt.toFixed(2)}°</ThemedText>
          <ThemedText>Target Az: {targetAz.toFixed(2)}°</ThemedText>
          <ThemedText style={{ marginTop: 6 }} type="defaultSemiBold">
            ΔAlt: {deltaAlt.toFixed(2)}° → {deltaAlt > 0 ? "Point UP" : "Point DOWN"}
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            ΔAz: {deltaAz.toFixed(2)}° → {deltaAz > 0 ? "Rotate RIGHT (E)" : "Rotate LEFT (W)"}
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}

export default AltAzGuidance;