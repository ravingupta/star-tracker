import { ThemedButton } from '@/components/ui/themed-button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

interface ManualTargetInputProps {
  onUseManual?: (ra: number, dec: number) => void;
  title?: string;
}

export function ManualTargetInput({ onUseManual, title = "Manual Target Entry" }: ManualTargetInputProps) {
  const textColor = useThemeColor({}, "text");
  const bgColor = useThemeColor({}, "background");
  const iconColor = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  const [manualRaInput, setManualRaInput] = useState("");
  const [manualDecInput, setManualDecInput] = useState("");
  const [raError, setRaError] = useState("");
  const [decError, setDecError] = useState("");

  function validateRa(ra: string): boolean {
    const value = parseFloat(ra);
    if (isNaN(value)) {
      setRaError("Invalid number");
      return false;
    }
    if (value < 0 || value >= 24) {
      setRaError("RA must be 0-24 hours");
      return false;
    }
    setRaError("");
    return true;
  }

  function validateDec(dec: string): boolean {
    const value = parseFloat(dec);
    if (isNaN(value)) {
      setDecError("Invalid number");
      return false;
    }
    if (value < -90 || value > 90) {
      setDecError("Dec must be -90 to +90°");
      return false;
    }
    setDecError("");
    return true;
  }

  function handleRaChange(text: string) {
    setManualRaInput(text);
    if (text !== "") {
      validateRa(text);
    } else {
      setRaError("");
    }
  }

  function handleDecChange(text: string) {
    setManualDecInput(text);
    if (text !== "") {
      validateDec(text);
    } else {
      setDecError("");
    }
  }

  function handleUseManual() {
    const raValid = validateRa(manualRaInput);
    const decValid = validateDec(manualDecInput);

    if (!raValid || !decValid) {
      Alert.alert("Invalid Coordinates", "Please correct the errors and try again.");
      return;
    }

    const ra = parseFloat(manualRaInput);
    const dec = parseFloat(manualDecInput);

    onUseManual?.(ra, dec);
    // Clear inputs after successful submission
    setManualRaInput("");
    setManualDecInput("");
    setRaError("");
    setDecError("");
  }

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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <MaterialIcons name="add-location" size={20} color={tint} style={{ marginRight: 8 }} />
        <ThemedText type="subtitle">{title}</ThemedText>
      </View>

      <ThemedText style={{ fontSize: 14, opacity: 0.8, marginBottom: 16, lineHeight: 20 }}>
        Enter celestial coordinates for precise telescope pointing to any astronomical object.
      </ThemedText>

      {/* RA Input */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <MaterialIcons name="schedule" size={16} color={iconColor} style={{ marginRight: 6 }} />
          <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>Right Ascension (RA)</ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>hours (0-24)</ThemedText>
        </View>
        <TextInput
          placeholder="e.g., 5.919"
          placeholderTextColor={iconColor}
          style={{
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            color: textColor,
            borderColor: raError ? errorColor : borderColor,
            backgroundColor: bgColor,
            fontSize: 16,
          }}
          keyboardType="decimal-pad"
          value={manualRaInput}
          onChangeText={handleRaChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {raError ? (
          <ThemedText style={{ fontSize: 12, color: errorColor, marginTop: 4 }}>
            {raError}
          </ThemedText>
        ) : null}
      </View>

      {/* Dec Input */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <MaterialIcons name="north" size={16} color={iconColor} style={{ marginRight: 6 }} />
          <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>Declination (Dec)</ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>degrees (-90 to +90)</ThemedText>
        </View>
        <TextInput
          placeholder="e.g., 7.407"
          placeholderTextColor={iconColor}
          style={{
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            color: textColor,
            borderColor: decError ? errorColor : borderColor,
            backgroundColor: bgColor,
            fontSize: 16,
          }}
          keyboardType="decimal-pad"
          value={manualDecInput}
          onChangeText={handleDecChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {decError ? (
          <ThemedText style={{ fontSize: 12, color: errorColor, marginTop: 4 }}>
            {decError}
          </ThemedText>
        ) : null}
      </View>

      {/* Action Button */}
      <ThemedButton
        title="Set Manual Target"
        onPress={handleUseManual}
        disabled={!manualRaInput || !manualDecInput || !!raError || !!decError}
        style={{
          paddingVertical: 12,
          borderRadius: 8,
          opacity: (!manualRaInput || !manualDecInput || !!raError || !!decError) ? 0.6 : 1,
        }}
      />

      {/* Examples */}
      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderColor }}>
        <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Examples:</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            { name: 'Betelgeuse', ra: '5.919', dec: '7.407' },
            { name: 'Sirius', ra: '6.752', dec: '-16.716' },
            { name: 'Vega', ra: '18.616', dec: '38.784' },
          ].map((example) => (
            <ThemedButton
              key={example.name}
              title={example.name}
              onPress={() => {
                setManualRaInput(example.ra);
                setManualDecInput(example.dec);
                setRaError("");
                setDecError("");
              }}
              variant="outline"
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                minHeight: 28,
              }}
            />
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

export default ManualTargetInput;
