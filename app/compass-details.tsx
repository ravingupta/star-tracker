import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useSettings } from '@/context/settings-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { altitudeFromAccel, getPitchRollFromAccel, tiltCompensatedHeading } from '@/lib/orientation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

// Note: True North correction (magnetic declination) is not applied here.
// If needed, supply it via settings.headingOffset or extend settings to include declination.

export default function CompassDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const tint = useThemeColor({}, "tint");
  const { settings } = useSettings();

  // Real-time sensor data
  const [heading, setHeading] = useState(0);
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = useState({ x: 0, y: 0, z: 0 });
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [alt, setAlt] = useState(0);

  // Parse the initial orientation data from params (for calibration offsets)
  const azOffset = parseFloat(params.azOffset as string) || 0;
  const altOffset = parseFloat(params.altOffset as string) || 0;

  // Refs to hold latest raw sensor data (avoid frequent re-renders)
  const magRef = useRef({ x: 0, y: 0, z: 0 });
  const accRef = useRef({ x: 0, y: 0, z: 0 });
  const headingRef = useRef(0);
  const pitchRef = useRef(0);
  const rollRef = useRef(0);
  const altRef = useRef(0);

  useEffect(() => {
    let magSub: { remove: () => void } | undefined;
    let accSub: { remove: () => void } | undefined;
  let tickId: ReturnType<typeof setInterval> | undefined;

    // Subscribe to sensors but only update refs (not state)
    magSub = Magnetometer.addListener((data) => {
      magRef.current = data as any;
    });
    accSub = Accelerometer.addListener((data) => {
      accRef.current = data as any;
    });

    // Moderate sensor rate; UI will update at 10 Hz separately
    Magnetometer.setUpdateInterval(120);
    Accelerometer.setUpdateInterval(120);

  const toDeg = (rad: number) => rad * (180 / Math.PI);
    const clamp360 = (deg: number) => ((deg % 360) + 360) % 360;
    const smoothLinear = (prev: number, next: number, alpha: number) => prev + alpha * (next - prev);
    const smoothAngle = (prev: number, next: number, alpha: number) => {
      const delta = ((next - prev + 540) % 360) - 180; // shortest path
      return clamp360(prev + alpha * delta);
    };

    const alpha = 0.25; // smoothing factor (0..1)

    const computeAndUpdate = () => {
  const { x: ax, y: ay, z: az } = accRef.current as any;
  const { x: mx, y: my, z: mz } = magRef.current as any;

  // Use shared project utilities for consistency
  const pr = getPitchRollFromAccel({ x: ax, y: ay, z: az }, settings);
  const pitchRad = pr.pitch;
  const rollRad = pr.roll;
  const headingDeg = tiltCompensatedHeading({ x: mx, y: my, z: mz }, pitchRad, rollRad, settings);

  // Apply calibration offset from Observe screen
  const azimuth = clamp360(headingDeg + azOffset);

  // Convert to degrees for UI and smooth
  const nextPitch = toDeg(pitchRad);
  const nextRoll = toDeg(rollRad);
  const nextAlt = altitudeFromAccel({ x: ax, y: ay, z: az }, { forwardAxis: 'y', forwardSign: 1, flip: settings.flipAltitude });

  const sHeading = smoothAngle(headingRef.current, azimuth, alpha);
  const sPitch = smoothLinear(pitchRef.current, nextPitch, alpha);
  const sRoll = smoothLinear(rollRef.current, nextRoll, alpha);
  const sAlt = smoothLinear(altRef.current, nextAlt, alpha);

  headingRef.current = sHeading;
  pitchRef.current = sPitch;
  rollRef.current = sRoll;
  altRef.current = sAlt;

      // Push to UI at controlled cadence
  setHeading(sHeading);
  setPitch(sPitch);
  setRoll(sRoll);
  setAlt(sAlt);
      setAccel(accRef.current);
      setMag(magRef.current);
    };

    // Update UI at ~10 FPS to reduce blinking
    tickId = setInterval(computeAndUpdate, 100);

    return () => {
      magSub?.remove();
      accSub?.remove();
      if (tickId) clearInterval(tickId);
    };
  }, [azOffset]);

  // Calculate current altitude with offset (alt derived from accel forward vs up)
  const currentAlt = alt + altOffset;

  // Get cardinal direction from azimuth
  const getCardinalDirection = (azimuth: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };

  // Get direction arrow based on azimuth
  const getDirectionArrow = (azimuth: number) => {
    if (azimuth >= 337.5 || azimuth < 22.5) return '↑ N';
    if (azimuth >= 22.5 && azimuth < 67.5) return '↗ NE';
    if (azimuth >= 67.5 && azimuth < 112.5) return '→ E';
    if (azimuth >= 112.5 && azimuth < 157.5) return '↘ SE';
    if (azimuth >= 157.5 && azimuth < 202.5) return '↓ S';
    if (azimuth >= 202.5 && azimuth < 247.5) return '↙ SW';
    if (azimuth >= 247.5 && azimuth < 292.5) return '← W';
    return '↖ NW';
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Compass Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back" size={24} color={tint} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'center' }}>
            <MaterialIcons name="explore" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Compass Details
            </ThemedText>
          </View>

          {/* Main Compass Display */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 3,
              borderColor: tint,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              backgroundColor: cardBgColor
            }}>
              <ThemedText style={{ fontSize: 25, fontWeight: 'bold', color: tint }}>
                {getCardinalDirection(heading)}
              </ThemedText>
              <ThemedText style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                {heading.toFixed(0)}°
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>
              {getDirectionArrow(heading)}
            </ThemedText>
          </View>

          {/* Orientation Values */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Current Orientation
            </ThemedText>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Azimuth:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {heading.toFixed(1)}° ({getCardinalDirection(heading)})
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Altitude:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {currentAlt.toFixed(1)}°
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Roll:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {roll.toFixed(1)}°
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Heading (with offsets):</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {heading.toFixed(1)}°
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Calibration Offsets */}
          {(azOffset !== 0 || altOffset !== 0) && (
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Calibration Offsets
              </ThemedText>
              <View style={{ backgroundColor: borderColor, opacity: 0.9, padding: 12, borderRadius: 8 }}>
                <ThemedText style={{ fontSize: 14 }}>
                  Azimuth Offset: {azOffset > 0 ? '+' : ''}{azOffset.toFixed(1)}°
                </ThemedText>
                <ThemedText style={{ fontSize: 14 }}>
                  Altitude Offset: {altOffset > 0 ? '+' : ''}{altOffset.toFixed(1)}°
                </ThemedText>
              </View>
            </View>
          )}

          {/* Raw Sensor Data */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Raw Sensor Data
            </ThemedText>
            <View style={{ gap: 8 }}>
              <View>
                <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Accelerometer (m/s²)</ThemedText>
                <View style={{ backgroundColor: borderColor, opacity: 0.9, padding: 8, borderRadius: 6 }}>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'monospace' }}>
                    X: {accel.x.toFixed(3)}, Y: {accel.y.toFixed(3)}, Z: {accel.z.toFixed(3)}
                  </ThemedText>
                </View>
              </View>

              <View>
                <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Magnetometer (μT)</ThemedText>
                <View style={{ backgroundColor: borderColor, opacity: 0.9, padding: 8, borderRadius: 6 }}>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'monospace' }}>
                    X: {mag.x.toFixed(3)}, Y: {mag.y.toFixed(3)}, Z: {mag.z.toFixed(3)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Orientation Explanation */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Understanding Orientation
            </ThemedText>
            <View style={{ gap: 6 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Azimuth: Horizontal direction (0° = North, 90° = East)
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Altitude: Vertical angle from horizon (90° = straight up)
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Roll: Device rotation around its axis
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Magnetic Heading: Raw compass direction before tilt compensation
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
