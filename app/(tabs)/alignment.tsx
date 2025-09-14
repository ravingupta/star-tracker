import { ThemedButton } from '@/components/ui/themed-button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { ALIGNMENT_STARS } from '@/constants/catalog';
import { useAlignmentContext } from '@/context/alignment-context';
import { useTargetContext } from '@/context/target-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { raDecToAltAz, rad2deg } from '@/lib/astro';
import { getPitchRollFromAccel, tiltCompensatedHeading, type Vec3 } from '@/lib/orientation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

// Fallback subscription type with remove() compatible with Expo listeners
type ListenerSub = { remove: () => void } | null;

export default function AlignmentScreen() {
  const iconColor = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");
  const bgColor = useThemeColor({}, "background");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  // sensor values
  const [accel, setAccel] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  // computed orientation
  const [pitchDeg, setPitchDeg] = useState(0);
  const [rollDeg, setRollDeg] = useState(0);
  const [headingDeg, setHeadingDeg] = useState(0);

  // alignment state
  const { alignmentPoints, addAlignmentPoint, clearAlignment, getOffsets, getAlignmentQuality } = useAlignmentContext();
  const { selectedTarget, setSelectedTarget } = useTargetContext();

  // subs refs
  const accelSub = useRef<ListenerSub>(null);
  const magSub = useRef<ListenerSub>(null);

  // set sensor update intervals and get location
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Magnetometer.setUpdateInterval(150);

    accelSub.current = Accelerometer.addListener((a) => {
      setAccel(a);
    });
    magSub.current = Magnetometer.addListener((m) => {
      setMag(m);
    });

    // Get location for astronomical calculations
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then((pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        });
      }
    });

    return () => {
      accelSub.current?.remove();
      magSub.current?.remove();
    };
  }, []);

  // compute pitch/roll & heading whenever accel or mag updates
  useEffect(() => {
    const { pitch, roll } = getPitchRollFromAccel(accel);
    const pitchD = rad2deg(pitch);
    const rollD = rad2deg(roll);
    setPitchDeg(pitchD);
    setRollDeg(rollD);

    const h = tiltCompensatedHeading(mag, pitch, roll);
    setHeadingDeg(h);
  }, [accel, mag]);

  const handleSync = () => {
    if (!selectedTarget || !location) {
      Alert.alert('Error', 'Please select a target and ensure location is available.');
      return;
    }

    // Calculate expected Alt/Az for the selected star
    const now = new Date();
    const { alt: calculatedAlt, az: calculatedAz } = raDecToAltAz(
      selectedTarget.ra,
      selectedTarget.dec,
      location.lat,
      location.lon,
      now
    );

    // Device orientation (assuming device is pointed at the star)
    // For simplicity, use current heading as Az, pitch as Alt (this might need adjustment)
    const deviceAz = headingDeg;
    const deviceAlt = pitchDeg;

    const alignmentPoint = {
      star: selectedTarget,
      deviceAz,
      deviceAlt,
      calculatedAz,
      calculatedAlt,
    };

    addAlignmentPoint(alignmentPoint);
    Alert.alert('Synced', `Alignment point added for ${selectedTarget.name}`);
  };

  const offsets = getOffsets();
  const quality = getAlignmentQuality();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 14, alignItems: "stretch" }}>
        {/* Current Status */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' }}>
            <MaterialIcons name="info" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Current Status
            </ThemedText>
          </View>
          <ThemedText>Az offset: {offsets.azOffset.toFixed(2)}°</ThemedText>
          <ThemedText>Alt offset: {offsets.altOffset.toFixed(2)}°</ThemedText>
          <ThemedText>Alignment quality: {quality}</ThemedText>
          <ThemedText>Reference points: {alignmentPoints.length}</ThemedText>
          {alignmentPoints.length > 0 && (
            <ThemedButton
              title="Clear Alignment"
              onPress={clearAlignment}
              variant="outline"
              style={{ marginTop: 8 }}
            />
          )}
        </ThemedView>

        {/* Step 1: Choose Known Star */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' }}>
            <MaterialIcons name="star" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Step 1: Choose Known Star
            </ThemedText>
          </View>
          <ThemedText style={{ marginBottom: 8, opacity: 0.8 }}>
            Select a bright star for alignment (Vega, Altair, Polaris, etc.)
          </ThemedText>
          <View style={{ gap: 8 }}>
            {ALIGNMENT_STARS.map((star) => (
              <ThemedButton
                key={star.name}
                title={star.name}
                onPress={() => setSelectedTarget(star)}
                variant={selectedTarget?.name === star.name ? "primary" : "outline"}
              />
            ))}
          </View>
        </ThemedView>

        {/* Step 2: Center Star in Eyepiece */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' }}>
            <MaterialIcons name="center-focus-strong" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Step 2: Center Star in Eyepiece
            </ThemedText>
          </View>
          <ThemedText style={{ marginBottom: 8, opacity: 0.8 }}>
            Point your device at the selected star and center it in your eyepiece, then press SYNC Now.
          </ThemedText>
          {selectedTarget && (
            <ThemedText style={{ marginBottom: 12, fontWeight: '600' }}>
              Selected: {selectedTarget.name}
            </ThemedText>
          )}
          <ThemedText style={{ marginBottom: 8 }}>
            Current orientation: Az {headingDeg.toFixed(1)}°, Alt {pitchDeg.toFixed(1)}°
          </ThemedText>
          <ThemedButton
            title="SYNC Now"
            onPress={handleSync}
            disabled={!selectedTarget}
          />
        </ThemedView>

        {/* Step 3: Multi-star Alignment */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' }}>
            <MaterialIcons name="add" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Step 3: Multi-star Alignment (Optional)
            </ThemedText>
          </View>
          <ThemedText style={{ marginBottom: 8, opacity: 0.8 }}>
            Add second/third reference stars for improved accuracy with least-squares fit.
          </ThemedText>
          <ThemedText style={{ marginBottom: 8 }}>
            Current points: {alignmentPoints.length}
          </ThemedText>
          {alignmentPoints.map((point, index) => (
            <ThemedText key={index} style={{ fontSize: 12, opacity: 0.7 }}>
              {point.star.name}: Az diff {(point.deviceAz - point.calculatedAz).toFixed(1)}°, Alt diff {(point.deviceAlt - point.calculatedAlt).toFixed(1)}°
            </ThemedText>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
