import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { LocationObject } from 'expo-location';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function ObserveHeader() {
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const cardBgColor = useThemeColor({}, "cardBackground");

  const [location, setLocation] = useState<LocationObject | null>(null);
  const [locStatus, setLocStatus] = useState("unknown");
  const [locationAge, setLocationAge] = useState<number | null>(null);

  useEffect(() => {
    // Get location for header display
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocStatus("denied");
          return;
        }
        setLocStatus("getting");
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setLocation(loc);
        const age = (Date.now() - loc.timestamp) / 1000;
        setLocationAge(age);
        setLocStatus("ok");

        // Update location continuously
        try {
          Location.watchPositionAsync({ accuracy: Location.Accuracy.Highest, timeInterval: 10000, distanceInterval: 10 }, (pos) => {
            setLocation(pos);
            const age = (Date.now() - pos.timestamp) / 1000;
            setLocationAge(age);
          });
        } catch (error) {
          console.error("Error starting location watch:", error);
          setLocStatus("error");
        }
      } catch (error) {
        console.error("Error getting location:", error);
        setLocStatus("error");
      }
    })();
  }, []);

  // update location age periodically to keep it current
  useEffect(() => {
    if (!location) return;
    
    const interval = setInterval(() => {
      const age = (Date.now() - location.timestamp) / 1000;
      setLocationAge(age);
    }, 1000); // update every second
    
    return () => clearInterval(interval);
  }, [location]);

  const getGpsStatusColor = (status: string) => {
    return status === "ok" ? successColor : errorColor;
  };

  // Calculate location quality score (0-100) based on multiple factors
  const getLocationQualityScore = (loc: LocationObject, age: number): number => {
    let score = 100;

    // Factor 1: Horizontal accuracy (most important for astronomical positioning)
    const horizontalAccuracy = loc.coords.accuracy;
    if (horizontalAccuracy) {
      if (horizontalAccuracy < 5) score *= 1.0; // Excellent
      else if (horizontalAccuracy < 10) score *= 0.9; // Very good
      else if (horizontalAccuracy < 25) score *= 0.8; // Good
      else if (horizontalAccuracy < 50) score *= 0.6; // Fair
      else if (horizontalAccuracy < 100) score *= 0.4; // Poor
      else score *= 0.2; // Very poor
    }

    // Factor 2: Vertical accuracy (altitude matters for astronomical calculations)
    const verticalAccuracy = loc.coords.altitudeAccuracy;
    if (verticalAccuracy) {
      if (verticalAccuracy < 10) score *= 1.0; // Excellent
      else if (verticalAccuracy < 25) score *= 0.95; // Good
      else if (verticalAccuracy < 50) score *= 0.9; // Fair
      else score *= 0.8; // Poor
    }

    // Factor 3: Location age (freshness)
    if (age < 10) score *= 1.0; // Very fresh
    else if (age < 30) score *= 0.95; // Fresh
    else if (age < 60) score *= 0.9; // Acceptable
    else if (age < 120) score *= 0.8; // Getting stale
    else if (age < 300) score *= 0.6; // Stale
    else score *= 0.3; // Very stale

    // Factor 4: Speed (moving devices may have less accurate positioning)
    const speed = loc.coords.speed;
    if (speed && speed > 1) { // Moving faster than 1 m/s
      if (speed > 5) score *= 0.8; // Fast movement significantly reduces accuracy
      else score *= 0.9; // Moderate movement slightly reduces accuracy
    }

    return Math.max(0, Math.min(100, score));
  };

  // Get quality color based on score
  const getQualityColor = (score: number) => {
    if (score >= 80) return successColor; // Excellent
    if (score >= 60) return successColor; // Good
    if (score >= 40) return '#FFA500'; // Fair (orange)
    return errorColor; // Poor
  };

  // Get quality icon based on score
  const getQualityIcon = (score: number) => {
    if (score >= 80) return "gps-fixed";
    if (score >= 60) return "gps-fixed";
    if (score >= 40) return "gps-not-fixed";
    return "gps-off";
  };

  // Navigate to detailed GPS quality information
  const showLocationDetails = (loc: LocationObject, age: number) => {
    router.push({
      pathname: '/gps-details',
      params: {
        location: JSON.stringify(loc),
        age: age.toString()
      }
    });
  };  
  return (
    <ThemedView style={{
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingTop: 60, // Account for status bar
    }}>
      {/* Header Row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <ThemedText type="title" style={{ fontSize: 18 }}>Observe</ThemedText>

        {/* Location Status - Compact */}
        <View style={{ alignItems: "flex-end", flexDirection: "column" }}>
          <ThemedText style={{ fontSize: 11, opacity: 0.8 }}>
            GPS: {location ? (
              <ThemedText style={{ 
                color: getGpsStatusColor(locStatus), 
                fontWeight: "600",
                fontSize: 10 
              }}>
                {location.coords.latitude.toFixed(4)}°, {location.coords.longitude.toFixed(4)}°
              </ThemedText>
            ) : (
              <ThemedText style={{ 
                color: getGpsStatusColor(locStatus), 
                fontWeight: "600",
                fontSize: 10 
              }}>
                {locStatus}
              </ThemedText>
            )}
          </ThemedText>
          
          {/* Location quality indicator */}
          {location && locationAge !== null && (
            <TouchableOpacity 
              onPress={() => showLocationDetails(location, locationAge)}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: -5 }}
            >
              <ThemedText style={{ fontSize: 9, opacity: 0.6 }}>
                {locationAge.toFixed(0)}s
              </ThemedText>
              <MaterialIcons
                name={getQualityIcon(getLocationQualityScore(location, locationAge))}
                size={10}
                color={getQualityColor(getLocationQualityScore(location, locationAge))}
                style={{ marginRight: 2, marginLeft: 6 }}
              />
              <ThemedText style={{
                fontSize: 9,
                opacity: 0.7,
                color: getQualityColor(getLocationQualityScore(location, locationAge))
              }}>
                {getLocationQualityScore(location, locationAge).toFixed(0)}%
              </ThemedText>
              {location.coords.accuracy && (
                <ThemedText style={{ fontSize: 9, opacity: 0.6, marginLeft: 6 }}>
                  ±{location.coords.accuracy.toFixed(0)}m
                </ThemedText>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ThemedView>
  );
}
