import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import type { CatalogItem } from '@/constants/catalog';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Pressable, View } from 'react-native';

function formatRA(hours: number) {
  const h = Math.floor(hours);
  const mFloat = (hours - h) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${h}h ${m}m ${s}s`;
}

function formatDec(deg: number) {
  const sign = deg < 0 ? '-' : '+';
  const a = Math.abs(deg);
  const d = Math.floor(a);
  const mFloat = (a - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${sign}${d}° ${m}' ${s}"`;
}

export type TargetListItemProps = {
  item: CatalogItem;
  selected?: boolean;
  onPress?: () => void;
};

export function TargetListItem({ item, selected, onPress }: TargetListItemProps) {
  const tint = useThemeColor({}, 'tint');
  const icon = useThemeColor({}, 'icon');
  const cardBgColor = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}> 
      <ThemedView
        style={{
          borderWidth: 1,
          borderColor: selected ? tint : borderColor,
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
          backgroundColor: cardBgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
          {selected ? (
            <ThemedText style={{ color: tint, fontWeight: '600' }}>Selected</ThemedText>
          ) : null}
        </View>
        <ThemedText style={{ marginTop: 6, opacity: 0.8 }}>
          RA {formatRA(item.ra)} · Dec {formatDec(item.dec)}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default TargetListItem;
