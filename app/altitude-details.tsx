import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useSettings } from '@/context/settings-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getPitchRollFromAccel } from '@/lib/orientation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function AltitudeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { settings } = useSettings();

  const cardBgColor = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');

  const [altitude, setAltitude] = useState(0); // degrees, smoothed
  const [rollDeg, setRollDeg] = useState(0); // degrees, smoothed
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });

  // Use the offset passed from Observe (default 0)
  const altOffset = parseFloat((params.altOffset as string) || '0') || 0;

  // Refs to hold latest raw accelerometer data
  const accRef = useRef({ x: 0, y: 0, z: 0 });
  const altRef = useRef(0);
  const rollRef = useRef(0);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    let tickId: ReturnType<typeof setInterval> | undefined;

    sub = Accelerometer.addListener((data) => {
      accRef.current = data as any;
    });

    // Moderate sensor rate
    Accelerometer.setUpdateInterval(120);

    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const smooth = (prev: number, next: number, alpha: number) => prev + alpha * (next - prev);

    const alpha = 0.25; // smoothing factor

    const compute = () => {
      const { x, y, z } = accRef.current as any;
      const { pitch, roll } = getPitchRollFromAccel({ x, y, z }, settings);

      const pitchDeg = toDeg(pitch);
      const rollD = toDeg(roll);

      const targetAlt = pitchDeg + altOffset; // flipAltitude already handled inside getPitchRollFromAccel

      const sAlt = smooth(altRef.current, targetAlt, alpha);
      const sRoll = smooth(rollRef.current, rollD, alpha);

      altRef.current = sAlt;
      rollRef.current = sRoll;

      setAltitude(sAlt);
      setRollDeg(sRoll);
      setAccel(accRef.current);
    };

    // Update UI at ~10 FPS
    tickId = setInterval(compute, 100);

    return () => {
      sub?.remove();
      if (tickId) clearInterval(tickId);
    };
  }, [settings, altOffset]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Altitude Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back" size={24} color={tint} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <ThemedView
          style={{
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderColor,
            backgroundColor: cardBgColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'center' }}>
            <MaterialIcons name="height" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">Altitude Details</ThemedText>
          </View>

          {/* Primary Altitude Display */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <ThemedText style={{ color: tint }} type='title'>
              {altitude.toFixed(1)}°
            </ThemedText>
            <ThemedText style={{ opacity: 0.8, marginTop: 6 }} type='defaultSemiBold'>Altitude (with offset)</ThemedText>
          </View>

          {/* Breakdown */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Components</ThemedText>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Altitude Offset:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {altOffset > 0 ? '+' : ''}{altOffset.toFixed(1)}°
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Flip Altitude Setting:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {settings.flipAltitude ? 'Enabled' : 'Disabled'}
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Roll:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {rollDeg.toFixed(1)}°
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Raw Sensor Data */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Raw Accelerometer</ThemedText>
            <View style={{ backgroundColor: borderColor, opacity: 0.8, padding: 12, borderRadius: 8 }}>
              <ThemedText style={{ fontSize: 12, fontFamily: 'monospace' }}>
                X: {accel.x.toFixed(3)}, Y: {accel.y.toFixed(3)}, Z: {accel.z.toFixed(3)}
              </ThemedText>
            </View>
          </View>

          {/* Explanation */}
          <View>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>What is Altitude?</ThemedText>
            <View style={{ gap: 6 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Altitude is the vertical angle from the horizon (0°) to the zenith (90°).
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • It is derived from device pitch from gravity sensing; flip option adjusts sign per mounting.
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Calibration offset adds a correction you measured during SYNC.
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
