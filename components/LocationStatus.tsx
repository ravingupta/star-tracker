import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { LocationObjectCoords } from 'expo-location';
import React from 'react';

interface LocationStatusProps {
  location: LocationObjectCoords | null;
  locStatus: string;
}

export function LocationStatus({ location, locStatus }: LocationStatusProps) {
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
      <ThemedText type="subtitle">Location</ThemedText>
      <ThemedText>Status: {locStatus}</ThemedText>
      {location ? (
        <>
          <ThemedText>Lat: {location.latitude.toFixed(6)}</ThemedText>
          <ThemedText>Lon: {location.longitude.toFixed(6)}</ThemedText>
        </>
      ) : (
        <ThemedText>Waiting for GPS...</ThemedText>
      )}
    </ThemedView>
  );
}

export default LocationStatus;