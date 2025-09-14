import { ThemedButton } from '@/components/ui/themed-button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useAlignmentContext } from '@/context/alignment-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

export default function IndexScreen() {
  const tint = useThemeColor({}, "tint");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");

    const { getOffsets, getAlignmentQuality, alignmentPoints } = useAlignmentContext();
  const [locationStatus, setLocationStatus] = useState<string>('unknown');
  const [locationAccuracy, setLocationAccuracy] = useState<string>('unknown');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const offsets = getOffsets();
  const quality = getAlignmentQuality();

  useEffect(() => {
    // Directly request location permissions on app start
    const initializePermissions = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationStatus(status);

        if (status === 'granted') {
          // Get location data
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Highest,
            });

            if (location.coords.accuracy && location.coords.accuracy < 10) {
              setLocationAccuracy('High Precision');
            } else if (location.coords.accuracy && location.coords.accuracy < 100) {
              setLocationAccuracy('Good Precision');
            } else {
              setLocationAccuracy('Standard Precision');
            }

            setCurrentLocation({
              lat: location.coords.latitude,
              lon: location.coords.longitude
            });
          } catch (error) {
            console.log('Error getting high accuracy location:', error);
            // Fallback to lower accuracy
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setLocationAccuracy('Basic Precision');
              setCurrentLocation({
                lat: location.coords.latitude,
                lon: location.coords.longitude
              });
            } catch (fallbackError) {
              console.log('Error getting location:', fallbackError);
              setLocationAccuracy('Limited Accuracy');
            }
          }
        } else {
          setLocationAccuracy('Not Granted');
        }
      } catch (error) {
        console.log('Error requesting location permission:', error);
        setLocationAccuracy('Not Granted');
      }
    };

    initializePermissions();

    // Update time every second for real-time display
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(status);
    if (status === 'granted') {
      // Try to get location
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setCurrentLocation({ lat: location.coords.latitude, lon: location.coords.longitude });
        setLocationAccuracy('High Precision');
      } catch {
        setLocationAccuracy('Basic Precision');
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'Night';
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const isDarkTime = () => {
    const hour = currentTime.getHours();
    return hour >= 20 || hour <= 6; // Assuming astronomical twilight
  };

  return (
    <ThemedView style={{ flex: 1, paddingTop: 60 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <ThemedText type="title" style={{ fontSize: 28, marginBottom: 4 }}>
            StarTracker
          </ThemedText>
          <ThemedText style={{ opacity: 0.8, fontSize: 16 }}>
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </ThemedText>
          {/* <ThemedText style={{
            opacity: 0.6,
            fontSize: 14,
            color: isDarkTime() ? '#4CAF50' : '#FF9800',
            marginTop: 4
          }}>
            {isDarkTime() ? '🌙 Good observing conditions' : '☀️ Wait for nightfall'}
          </ThemedText> */}
        </View>

        {/* Status Overview */}
        <ThemedView style={{
          borderWidth: 1,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderColor: borderColor,
          backgroundColor: cardBgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <ThemedText type="subtitle" style={{ marginBottom: 16, textAlign: 'center' }}>
            System Status
          </ThemedText>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <ThemedText style={{ opacity: 0.8 }}>Location:</ThemedText>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText style={{
                color: locationStatus === 'granted' ? '#4CAF50' :
                       locationStatus === 'denied' ? '#F44336' : tint,
                fontWeight: '600'
              }}>
                {locationStatus === 'granted' ? '✓ Enabled' :
                 locationStatus === 'denied' ? '✗ Denied' : 'Checking...'}
              </ThemedText>
              {locationStatus === 'granted' && (
                <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                  {locationAccuracy}
                </ThemedText>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <ThemedText style={{ opacity: 0.8 }}>Alignment:</ThemedText>
            <ThemedText style={{
              color: quality !== 'none' ? '#4CAF50' : '#FF9800',
              fontWeight: '600'
            }}>
              {quality === 'none' ? 'Not Aligned' : `${quality} Aligned`}
            </ThemedText>
          </View>

          {quality !== 'none' && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText style={{ opacity: 0.8 }}>Accuracy:</ThemedText>
              <ThemedText style={{ fontWeight: '600' }}>
                ±{Math.max(Math.abs(offsets.azOffset), Math.abs(offsets.altOffset)).toFixed(1)}°
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Location Settings */}
        {locationStatus === 'granted' && locationAccuracy !== 'High Precision' && locationAccuracy !== 'Good Precision' && (
          <ThemedView style={{
            borderWidth: 1,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderColor: '#FF9800',
            backgroundColor: cardBgColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <ThemedText type="subtitle" style={{ marginBottom: 12, textAlign: 'center', color: '#FF9800' }}>
              📍 Improve Location Accuracy
            </ThemedText>
            <ThemedText style={{ opacity: 0.8, lineHeight: 20, textAlign: 'center', marginBottom: 16 }}>
              For precise astronomical calculations, enable high precision location services.
            </ThemedText>
            <ThemedButton
              title="Enable High Precision GPS"
              onPress={requestPermission}
              style={{ paddingVertical: 12 }}
            />
          </ThemedView>
        )}
        {/* Permission Required Notice */}
        {locationStatus !== 'granted' && (
          <ThemedView style={{
            borderWidth: 1,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderColor: '#F44336',
            backgroundColor: cardBgColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <ThemedText type="subtitle" style={{ marginBottom: 12, textAlign: 'center', color: '#F44336' }}>
              📍 Location Permission Required
            </ThemedText>
            <ThemedText style={{ opacity: 0.8, lineHeight: 20, textAlign: 'center', marginBottom: 16 }}>
              StarTracker needs location access for accurate astronomical calculations and star positioning.
            </ThemedText>
            <ThemedButton
              title="Grant Location Permission"
              onPress={requestPermission}
              style={{ paddingVertical: 12 }}
            />
          </ThemedView>
        )}

        {/* Quick Actions */}
        <ThemedView style={{
          borderWidth: 1,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderColor: borderColor,
          backgroundColor: cardBgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <ThemedText type="subtitle" style={{ marginBottom: 16, textAlign: 'center' }}>
            Quick Actions
          </ThemedText>

          <View style={{ gap: 12 }}>
            <ThemedButton
              title="Start Observing"
              onPress={() => locationStatus === 'granted' ? router.push('/observe') : requestPermission()}
              style={{ paddingVertical: 14 }}
              disabled={locationStatus !== 'granted'}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ThemedButton
                title="Align Stars"
                onPress={() => locationStatus === 'granted' ? router.push('/alignment') : requestPermission()}
                variant="outline"
                style={{ flex: 1, paddingVertical: 12 }}
                disabled={locationStatus !== 'granted'}
              />
              <ThemedButton
                title="Targets"
                onPress={() => locationStatus === 'granted' ? router.push('/targets') : requestPermission()}
                variant="outline"
                style={{ flex: 1, paddingVertical: 12 }}
                disabled={locationStatus !== 'granted'}
              />
            </View>
          </View>
        </ThemedView>

        {/* Current Conditions */}
        <ThemedView style={{
          borderWidth: 1,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderColor: borderColor,
          backgroundColor: cardBgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12, textAlign: 'center' }}>
            Observing Conditions
          </ThemedText>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 24, marginBottom: 4 }}>
                {isDarkTime() ? '🌙' : '☀️'}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                {getTimeOfDay()}
              </ThemedText>
            </View>

            <View style={{ alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 24, marginBottom: 4 }}>
                {quality !== 'none' ? '🎯' : '⚠️'}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                {quality !== 'none' ? 'Ready' : 'Setup Needed'}
              </ThemedText>
            </View>

            <View style={{ alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 24, marginBottom: 4 }}>
                {locationStatus === 'granted' ?
                  (locationAccuracy === 'High Precision' ? '🎯' :
                   locationAccuracy === 'Good Precision' ? '📍' : '📍') : '❓'}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                {locationStatus === 'granted' ? locationAccuracy : 'GPS Off'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Tips */}
        <ThemedView style={{
          borderWidth: 1,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderColor: borderColor,
          backgroundColor: cardBgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12, textAlign: 'center' }}>
            {getTimeOfDay()} Tip
          </ThemedText>

          {!isDarkTime() ? (
            <ThemedText style={{ opacity: 0.8, lineHeight: 20, textAlign: 'center' }}>
              It's daytime! Use this time to plan your observing session, check your equipment, and align your telescope.
            </ThemedText>
          ) : locationStatus !== 'granted' ? (
            <ThemedText style={{ opacity: 0.8, lineHeight: 20, textAlign: 'center' }}>
              Location access is required for accurate astronomical calculations. Please grant location permission to continue.
            </ThemedText>
          ) : locationAccuracy !== 'High Precision' && locationAccuracy !== 'Good Precision' ? (
            <ThemedText style={{ opacity: 0.8, lineHeight: 20, textAlign: 'center' }}>
              Enable high precision GPS for the most accurate star positioning and telescope guidance.
            </ThemedText>
          ) : quality === 'none' ? (
            <ThemedText style={{ opacity: 0.8, lineHeight: 20, textAlign: 'center' }}>
              Perfect night for alignment! Start with bright stars like Vega or Polaris to calibrate your tracking system.
            </ThemedText>
          ) : (
            <ThemedText style={{ opacity: 0.8, lineHeight: 20, textAlign: 'center' }}>
              You're aligned and ready! Browse the target catalog to find interesting objects to observe tonight.
            </ThemedText>
          )}
        </ThemedView>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ThemedText style={{ opacity: 0.6, fontSize: 14, textAlign: 'center' }}>
            {isDarkTime() ? 'Clear skies and good observing!' : 'Prepare for tonight\'s session'}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
