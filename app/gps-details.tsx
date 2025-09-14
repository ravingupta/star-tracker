import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { LocationObject } from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function GPSDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const tint = useThemeColor({}, "tint");

  // Parse the location data from params
  const location: LocationObject = JSON.parse(params.location as string);
  const age: number = parseFloat(params.age as string);

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

  // Get quality text based on score
  const getQualityText = (score: number) => {
    if (score >= 80) return "Excellent";
    else if (score >= 60) return "Good";
    else if (score >= 40) return "Fair";
    return "Poor";
  };

  // Get quality icon based on score
  const getQualityIcon = (score: number) => {
    if (score >= 80) return "gps-fixed";
    if (score >= 60) return "gps-fixed";
    if (score >= 40) return "gps-not-fixed";
    return "gps-off";
  };

  const qualityScore = getLocationQualityScore(location, age);
  const horizontalAcc = location.coords.accuracy;
  const verticalAcc = location.coords.altitudeAccuracy;
  const speed = location.coords.speed;
  const qualityText = getQualityText(qualityScore);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen 
        options={{
          title: 'GPS Details',
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
            <MaterialIcons name="gps-fixed" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              GPS Quality Details
            </ThemedText>
          </View>

          {/* Overall Quality */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <MaterialIcons
              name={getQualityIcon(qualityScore)}
              size={48}
              color={getQualityColor(qualityScore)}
              style={{ marginBottom: 8 }}
            />
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: getQualityColor(qualityScore) }}>
              {qualityText}
            </ThemedText>
            <ThemedText style={{ fontSize: 16, opacity: 0.8 }}>
              {qualityScore.toFixed(0)}% Quality Score
            </ThemedText>
          </View>

          {/* Location Coordinates */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Current Location
            </ThemedText>
            <View style={{ backgroundColor: borderColor, opacity: 0.8, padding: 12, borderRadius: 8 }}>
              <ThemedText style={{ fontSize: 14, fontFamily: 'monospace' }}>
                Latitude: {location.coords.latitude.toFixed(6)}°
              </ThemedText>
              <ThemedText style={{ fontSize: 14, fontFamily: 'monospace' }}>
                Longitude: {location.coords.longitude.toFixed(6)}°
              </ThemedText>
              {location.coords.altitude && (
                <ThemedText style={{ fontSize: 14, fontFamily: 'monospace' }}>
                  Altitude: {location.coords.altitude.toFixed(1)}m
                </ThemedText>
              )}
            </View>
          </View>

          {/* Accuracy Details */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Accuracy Information
            </ThemedText>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Horizontal Accuracy:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {horizontalAcc ? `±${horizontalAcc.toFixed(1)}m` : 'Unknown'}
                </ThemedText>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Vertical Accuracy:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {verticalAcc ? `±${verticalAcc.toFixed(1)}m` : 'Unknown'}
                </ThemedText>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Data Age:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {age.toFixed(1)} seconds
                </ThemedText>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 14 }}>Speed:</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  {speed ? `${(speed * 3.6).toFixed(1)} km/h` : 'Stationary'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Quality Factors Explanation */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Quality Factors
            </ThemedText>
            <View style={{ gap: 6 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Horizontal accuracy affects positioning precision
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Vertical accuracy impacts altitude calculations
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Fresh data provides better reliability
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                • Movement can reduce GPS accuracy
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
