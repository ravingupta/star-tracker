import { ThemedText } from '@/components/ui/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';

type ThemedButtonProps = {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  variant?: 'primary' | 'outline';
  accessibilityLabel?: string;
  borderColor?: string;
};

export function ThemedButton({
  title,
  children,
  onPress,
  disabled,
  style,
  variant = 'primary',
  accessibilityLabel,
  borderColor,
}: ThemedButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme() ?? 'light';

  // Choose readable text color for primary
  const primaryTextColor = colorScheme === 'dark' ? Colors.light.text : '#fff';

  const baseStyle: ViewStyle = {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  const primaryStyle: ViewStyle = {
    backgroundColor: tint,
  };

  const outlineStyle: ViewStyle = {
    borderWidth: 1,
    borderColor: borderColor || tint,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        baseStyle,
        variant === 'primary' ? primaryStyle : outlineStyle,
        pressed && !disabled ? { opacity: 0.9 } : null,
        style,
      ]}
    >
      {children ? (
        children
      ) : (
        <ThemedText
          style={{ color: variant === 'primary' ? primaryTextColor : (borderColor || tint), fontWeight: '600' }}
        >
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

export default ThemedButton;
