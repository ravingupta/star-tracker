import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useSettings } from "@/context/settings-context";
import { useTargetContext } from "@/context/target-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { raDecToAltAz, rad2deg } from "@/lib/astro";
import { altitudeFromAccel, getPitchRollFromAccel, tiltCompensatedHeading, type Vec3 } from "@/lib/orientation";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import type { LocationObject } from "expo-location";
import * as Location from "expo-location";
import { router } from 'expo-router';
import { Accelerometer, Magnetometer } from "expo-sensors";
import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

// Fallback subscription type with remove() compatible with Expo listeners
type ListenerSub = { remove: () => void } | null;

export default function ObserveScreen() {
  // theme colors
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");

  // sensor values
  const [accel, setAccel] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = useState<Vec3>({ x: 0, y: 0, z: 0 });

  // computed orientation
  const [pitchDeg, setPitchDeg] = useState(0); // diagnostic
  const [rollDeg, setRollDeg] = useState(0);
  const [headingDeg, setHeadingDeg] = useState(0); // tilt-compensated magnetic heading (deg)
  const [altitudeDeg, setAltitudeDeg] = useState(0); // computed from accel forward vs up

  // gps
  const [location, setLocation] = useState<LocationObject | null>(null);

  // chosen target (catalog or manual)
  const {
    selectedTarget: target,
    useManual,
    manualRa: ctxManualRa,
    manualDec: ctxManualDec,
  } = useTargetContext();

  // settings
  const { settings } = useSettings();

  // computed target alt/az
  const [targetAlt, setTargetAlt] = useState<number | null>(null);
  const [targetAz, setTargetAz] = useState<number | null>(null);

  // deltas and offsets (sync)
  const [deltaAlt, setDeltaAlt] = useState(0);
  const [deltaAz, setDeltaAz] = useState(0);
  const [azOffset, setAzOffset] = useState(0);
  const [altOffset, setAltOffset] = useState(0);

  // subs refs
  const accelSub = useRef<ListenerSub>(null);
  const magSub = useRef<ListenerSub>(null);
  // raw refs (updated by listeners without causing re-render)
  const accRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const magRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  // smoothed refs
  const headingRef = useRef(0);
  const altRef = useRef(0);
  const pitchRef = useRef(0);
  const rollRef = useRef(0);

  // set sensor update intervals based on smoothing strength
  useEffect(() => {
    let accelInterval = 100;
    let magInterval = 150;

    switch (settings.smoothingStrength) {
      case 'low':
        accelInterval = 50;
        magInterval = 75;
        break;
      case 'med':
        accelInterval = 100;
        magInterval = 150;
        break;
      case 'high':
        accelInterval = 200;
        magInterval = 300;
        break;
    }

    Accelerometer.setUpdateInterval(accelInterval);
    Magnetometer.setUpdateInterval(magInterval);

    accelSub.current = Accelerometer.addListener((a) => {
      accRef.current = a as Vec3;
    });
    magSub.current = Magnetometer.addListener((m) => {
      magRef.current = m as Vec3;
    });

    // request location permissions & start GPS
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission denied");
          return;
        }
        // optionally start watchPosition to update location continuously:
        Location.watchPositionAsync({ accuracy: Location.Accuracy.Highest, timeInterval: 5000, distanceInterval: 1 }, (pos) => {
          setLocation(pos);
        });
      } catch (error) {
        console.error("Error setting up location watch:", error);
      }
    })();

    return () => {
      accelSub.current?.remove();
      magSub.current?.remove();
    };
  }, [settings.smoothingStrength]);

  // Rate-limit and smooth orientation updates for stable UI
  useEffect(() => {
    const clamp360 = (deg: number) => ((deg % 360) + 360) % 360;
    const smoothLinear = (prev: number, next: number, alpha: number) => prev + alpha * (next - prev);
    const smoothAngle = (prev: number, next: number, alpha: number) => {
      const delta = ((next - prev + 540) % 360) - 180; // shortest path
      return clamp360(prev + alpha * delta);
    };

    let alpha = 0.22;
    let tickMs = 120;
    if (settings.smoothingStrength === 'low') { alpha = 0.35; tickMs = 90; }
    if (settings.smoothingStrength === 'high') { alpha = 0.12; tickMs = 160; }

    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      const a = accRef.current;
      const m = magRef.current;

      // derive orientation
      const { pitch, roll } = getPitchRollFromAccel(a, settings);
      const headingRaw = tiltCompensatedHeading(m, pitch, roll, settings);
      const altRaw = altitudeFromAccel(a, { forwardAxis: 'y', forwardSign: 1, flip: settings.flipAltitude });

      // smooth
      const nextPitchDeg = rad2deg(pitch);
      const nextRollDeg = rad2deg(roll);
      const sHeading = smoothAngle(headingRef.current, headingRaw, alpha);
      const sAlt = smoothLinear(altRef.current, altRaw, alpha);
      const sPitch = smoothLinear(pitchRef.current, nextPitchDeg, alpha);
      const sRoll = smoothLinear(rollRef.current, nextRollDeg, alpha);

      headingRef.current = sHeading;
      altRef.current = sAlt;
      pitchRef.current = sPitch;
      rollRef.current = sRoll;

      // push to UI
      setHeadingDeg(sHeading);
      setAltitudeDeg(sAlt);
      setPitchDeg(sPitch);
      setRollDeg(sRoll);
      // also expose latest raw sensors for debug/details
      setAccel(a);
      setMag(m);
    };

    timer = setInterval(tick, tickMs);
    return () => { if (timer) clearInterval(timer); };
  }, [settings]);

  // Here we map device pitch -> Altitude (deg), headingDeg -> Azimuth (deg)
  // Depending on how you mount the phone, you might need to invert the sign of pitch,
  // or add/subtract 90°, etc. We'll give the user a simple "flip sign" option below in comments if needed.
  const currentAlt = altitudeDeg + altOffset;
  let currentAz = headingDeg + azOffset;
  if (currentAz < 0) currentAz += 360;
  if (currentAz >= 360) currentAz -= 360;

  // compute target Alt/Az when target or location changes or time ticks
  useEffect(() => {
    const computeTarget = () => {
      const now = new Date();

      // Use manual location if auto is disabled and coordinates are provided
      let lat = location?.coords.latitude;
      let lon = location?.coords.longitude;

      if (!settings.autoLocation && settings.manualLat && settings.manualLon) {
        lat = parseFloat(settings.manualLat);
        lon = parseFloat(settings.manualLon);
      }

      if (useManual) {
        const ra = ctxManualRa ?? 0;
        const dec = ctxManualDec ?? 0;
        if (!isNaN(ra) && !isNaN(dec) && lat !== undefined && lon !== undefined) {
          const res = raDecToAltAz(ra, dec, lat, lon, now);
          setTargetAlt(res.alt);
          setTargetAz(res.az);
        }
      } else {
        if (target && lat !== undefined && lon !== undefined) {
          const res = raDecToAltAz(target.ra, target.dec, lat, lon, now);
          setTargetAlt(res.alt);
          setTargetAz(res.az);
        }
      }
    };
    computeTarget();
    // update every 2 seconds to track Earth's rotation for long sessions
    const interval = setInterval(computeTarget, 2000);
    return () => clearInterval(interval);
  }, [target, useManual, ctxManualRa, ctxManualDec, location, settings]);

  // compute deltas when target or current changes
  useEffect(() => {
    if (targetAlt === null || targetAz === null) return;
    // delta Az shortest path (-180..+180)
    let dAz = targetAz - currentAz;
    while (dAz > 180) dAz -= 360;
    while (dAz < -180) dAz += 360;
    setDeltaAz(dAz);
    setDeltaAlt(targetAlt - currentAlt);
  }, [targetAlt, targetAz, currentAlt, currentAz]);

  // SYNC: user centers target visually and taps SYNC to record offsets
  async function handleSync() {
    if (targetAlt === null || targetAz === null) {
      Alert.alert("No target", "Select or enter a target before syncing.");
      return;
    }

    // Add haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Confirm SYNC",
      "Make sure your device is pointing directly at the target. This will calibrate your pointing accuracy.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SYNC Now",
          style: "default",
          onPress: () => {
            // compute offsets such that measured + offset = target
            const newAzOffset = (targetAz - headingDeg + 540) % 360 - 180; // normalized
            const newAltOffset = targetAlt - altitudeDeg; // match currentAlt computation
            setAzOffset(newAzOffset);
            setAltOffset(newAltOffset);
            Alert.alert("SYNC Complete", `Calibration stored!\nAzimuth: ${newAzOffset.toFixed(2)}°\nAltitude: ${newAltOffset.toFixed(2)}°`);
          }
        }
      ]
    );
  }

  // Reset sync offsets
  async function resetSync() {
    // Add haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      "Reset Calibration",
      "This will clear all calibration corrections and reset pointing accuracy to default.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setAzOffset(0);
            setAltOffset(0);
            Alert.alert("Calibration Reset", "All calibration corrections have been cleared.");
          }
        }
      ]
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Main Content Area - No header clutter */}
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: "stretch" }}>
        {/* Live Sensor Data */}
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
            <MaterialIcons name="explore" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Live Orientation
            </ThemedText>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
            <TouchableOpacity
              style={{ alignItems: "center" }}
              onPress={() => router.push({
                pathname: '/altitude-details',
                params: { altOffset: altOffset.toString() }
              })}
            >
              <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
                {currentAlt.toFixed(0)}°
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Altitude</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ alignItems: "center" }}
              onPress={() => router.push({
                pathname: '/compass-details',
                params: {
                  currentAz: currentAz.toString(),
                  currentAlt: currentAlt.toString(),
                  rollDeg: rollDeg.toString(),
                  headingDeg: headingDeg.toString(),
                  azOffset: azOffset.toString(),
                  altOffset: altOffset.toString(),
                  accel: JSON.stringify(accel),
                  mag: JSON.stringify(mag)
                }
              })}
            >
              <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
                {currentAz.toFixed(0)}°
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Azimuth</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <ThemedText style={{ fontSize: 14 }}>
                Roll: {rollDeg.toFixed(1)}°
              </ThemedText>
            </View>

            <View style={{ alignItems: "center" }}>
              <ThemedText style={{ fontSize: 14 }}>
                Heading: {headingDeg.toFixed(1)}°
              </ThemedText>
            </View>
          </View>

          {(azOffset !== 0 || altOffset !== 0) && (
            <View style={{ marginTop: 8, paddingTop: 8 }}>
              <ThemedText style={{ fontSize: 10, textAlign: "center", opacity: 0.6 }}>
                Calibrated: Az +{azOffset.toFixed(1)}° • Alt +{altOffset.toFixed(1)}°
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Target Selection - Show when no target selected */}
        {target === null && !useManual && (
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
              <MaterialIcons name="gps-not-fixed" size={24} color={tint} style={{ marginRight: 8 }} />
              <ThemedText type="subtitle">
                No Target Selected
              </ThemedText>
            </View>

            <ThemedText style={{ fontSize: 14, opacity: 0.8, marginBottom: 16, textAlign: 'center' }}>
              Select a celestial object to begin tracking.
            </ThemedText>

            <ThemedButton
              title="Select Target"
              onPress={() => router.push('/targets')}
              style={{
                paddingVertical: 12,
                borderRadius: 8
              }}
            />
          </ThemedView>
        )}

        {/* Target Guidance */}
        {targetAlt !== null && targetAz !== null && (
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
              <MaterialIcons name="gps-fixed" size={24} color={tint} style={{ marginRight: 8 }} />
              <ThemedText type="subtitle">
                Pointing Guidance
              </ThemedText>
            </View>

            <View style={{ alignItems: "center", marginBottom: 12 }}>
              {useManual ? (
                <ThemedText style={{ color: textColor, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                  Manual: RA {ctxManualRa?.toFixed(3)}h, Dec {ctxManualDec?.toFixed(3)}°
                </ThemedText>
              ) : target ? (
                <ThemedText style={{ color: textColor, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                  {target.name}
                </ThemedText>
              ) : (
                <ThemedText style={{ color: textColor, fontSize: 14, opacity: 0.8, marginBottom: 4 }}>
                  No target selected
                </ThemedText>
              )}
              <ThemedText style={{ fontSize: 14, opacity: 0.8 }}>
                Target: {targetAlt.toFixed(1)}° Alt, {targetAz.toFixed(1)}° Az
              </ThemedText>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <View style={{ alignItems: "center", flex: 1 }}>
                <ThemedText style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: Math.abs(deltaAlt) > 5 ? errorColor : successColor
                }}>
                  {deltaAlt > 0 ? "↑" : "↓"} {Math.abs(deltaAlt).toFixed(1)}°
                </ThemedText>
                <ThemedText style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {deltaAlt > 0 ? "Point UP" : "Point DOWN"}
                </ThemedText>
              </View>

              <View style={{ width: 1, height: 40, backgroundColor: iconColor, opacity: 0.3 }} />

              <View style={{ alignItems: "center", flex: 1 }}>
                <ThemedText style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: Math.abs(deltaAz) > 5 ? errorColor : successColor
                }}>
                  {deltaAz > 0 ? "→" : "←"} {Math.abs(deltaAz).toFixed(1)}°
                </ThemedText>
                <ThemedText style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {deltaAz > 0 ? "Turn RIGHT" : "Turn LEFT"}
                </ThemedText>
              </View>
            </View>

            {/* Fine print details */}
            <View style={{ marginTop: 8, paddingTop: 8, opacity: 0.6 }}>
              {settings.selectedTelescopeId && (() => {
                const selectedScope = settings.telescopes.find(t => t.id === settings.selectedTelescopeId);
                const selectedEp = selectedScope?.eyepieces.find(e => e.id === settings.selectedEyepieceId);
                if (!selectedScope || !selectedEp) return null;
                const magnification = Math.round((selectedScope.focalLengthMm / selectedEp.focalLengthMm) * 10) / 10;
                const tfov = selectedEp.apparentFovDeg ? Math.round((selectedEp.apparentFovDeg / magnification) * 10) / 10 : undefined;
                if (!tfov) return null;
                const driftMinutes = Math.round(((tfov / 2) / 15) * 60); // 15° per hour, from center to edge
                return (
                  <ThemedText style={{ fontSize: 10, textAlign: 'center', lineHeight: 14, marginTop: 4 }}>
                    Object drifts from center to edge of {tfov}° field in ~{driftMinutes} minutes
                  </ThemedText>
                );
              })()}
            </View>
          </ThemedView>
        )}

        {settings.debugOverlay && (
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
              <MaterialIcons name="bug-report" size={24} color={tint} style={{ marginRight: 8 }} />
              <ThemedText type="subtitle">
                Sensor Debug
              </ThemedText>
            </View>

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Accelerometer</ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: 'monospace' }}>
                X: {accel.x.toFixed(3)}, Y: {accel.y.toFixed(3)}, Z: {accel.z.toFixed(3)}
              </ThemedText>
            </View>

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Magnetometer</ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: 'monospace' }}>
                X: {mag.x.toFixed(3)}, Y: {mag.y.toFixed(3)}, Z: {mag.z.toFixed(3)}
              </ThemedText>
            </View>

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Location</ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: 'monospace' }}>
                Lat: {location?.coords.latitude.toFixed(6)}, Lon: {location?.coords.longitude.toFixed(6)}
              </ThemedText>
            </View>

            <View>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Settings</ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: 'monospace' }}>
                Smoothing: {settings.smoothingStrength}, Flip Alt: {settings.flipAltitude ? 'Y' : 'N'}, Offset: {settings.headingOffset}°
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {/* Selected Optics Details */}
        {settings.selectedTelescopeId && (
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
              <MaterialIcons name="filter-center-focus" size={24} color={tint} style={{ marginRight: 8 }} />
              <ThemedText type="subtitle">
                Optics
              </ThemedText>
            </View>

            {(() => {
              const selectedScope = settings.telescopes.find(t => t.id === settings.selectedTelescopeId);
              const selectedEp = selectedScope?.eyepieces.find(e => e.id === settings.selectedEyepieceId);
              if (!selectedScope || !selectedEp) return null;

              const magnification = Math.round((selectedScope.focalLengthMm / selectedEp.focalLengthMm) * 10) / 10;
              const tfov = selectedEp.apparentFovDeg ? Math.round((selectedEp.apparentFovDeg / magnification) * 10) / 10 : undefined;

              return (
                <View>
                  <View style={{ marginBottom: 8 }}>
                    <ThemedText style={{ fontWeight: '600' }}>{selectedScope.name}</ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                      {selectedScope.apertureMm}mm aperture • {selectedScope.focalLengthMm}mm focal • f/{Math.round((selectedScope.focalLengthMm / selectedScope.apertureMm) * 10) / 10}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                      Light gathering: {Math.round((selectedScope.apertureMm / 50) ** 2)}x human eye
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText style={{ fontWeight: '600' }}>{selectedEp.name || `${selectedEp.focalLengthMm}mm`}</ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                      {selectedEp.focalLengthMm}mm focal • {magnification}x magnification{tfov ? ` • ${tfov}° true field of view` : ''}
                    </ThemedText>
                    {selectedEp.apparentFovDeg && (
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        Apparent FOV: {selectedEp.apparentFovDeg}°
                      </ThemedText>
                    )}
                  </View>
                </View>
              );
            })()}
          </ThemedView>
        )}

        {/* Sync Controls */}
        <ThemedView style={{
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          backgroundColor: cardBgColor,
          borderWidth: 1,
          borderColor: borderColor
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'center' }}>
            <MaterialIcons name="sync" size={20} color={tint} style={{ marginRight: 6 }} />
            <ThemedText type="subtitle" style={{ fontSize: 16 }}>
              Calibration
            </ThemedText>
          </View>

          <ThemedText style={{ fontSize: 12, opacity: 0.8, marginBottom: 12, textAlign: 'center', lineHeight: 16 }}>
            Point at target, tap SYNC to calibrate accuracy.
          </ThemedText>

          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <ThemedButton
              title="SYNC"
              onPress={handleSync}
              style={{
                flex: 1,
                paddingVertical: 12,
                minHeight: 44,
                borderRadius: 8
              }}
            />
            <ThemedButton
              title="Reset"
              onPress={resetSync}
              variant="outline"
              borderColor={errorColor}
              style={{
                flex: 1,
                paddingVertical: 12,
                minHeight: 44,
                borderRadius: 8,
                borderWidth: 2
              }}
            />
          </View>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}
