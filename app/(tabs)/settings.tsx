import { ThemedButton } from '@/components/ui/themed-button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useSettings } from '@/context/settings-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Alert, ScrollView, Switch, TextInput, View } from 'react-native';

export default function SettingsScreen() {
  const tint = useThemeColor({}, "tint");
  const bgColor = useThemeColor({}, "background");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  const { settings, updateSetting, resetSettings } = useSettings();

  const handleResetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to default?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetSettings();
            Alert.alert("Settings Reset", "All settings have been reset to default values.");
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will clear all saved targets and calibration data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: () => {
            // TODO: Implement data clearing logic
            Alert.alert("Data Cleared", "All user data has been cleared.");
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 14, alignItems: "stretch" }}>
        <ThemedText style={{ opacity: 0.8, marginBottom: 20, textAlign: 'center' }}>
          Configure your star tracker preferences and options.
        </ThemedText>

        {/* Orientation Settings */}
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
              Orientation Settings
            </ThemedText>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <ThemedText>Flip Altitude sign</ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Invert the altitude direction</ThemedText>
            </View>
            <Switch
              value={settings.flipAltitude}
              onValueChange={(value) => updateSetting('flipAltitude', value)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText>Heading calibration offset (deg)</ThemedText>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 8,
                padding: 8,
                marginTop: 4,
                color: textColor,
                backgroundColor: bgColor
              }}
              keyboardType="numeric"
              value={settings.headingOffset.toString()}
              onChangeText={(text) => updateSetting('headingOffset', parseFloat(text) || 0)}
              placeholder="0"
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <ThemedText>True vs Magnetic North</ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Use true north instead of magnetic</ThemedText>
            </View>
            <Switch
              value={settings.useTrueNorth}
              onValueChange={(value) => updateSetting('useTrueNorth', value)}
            />
          </View>
        </ThemedView>

        {/* Location Settings */}
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
            <MaterialIcons name="location-on" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Location Settings
            </ThemedText>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <ThemedText>Auto (GPS)</ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Automatically detect your location</ThemedText>
            </View>
            <Switch
              value={settings.autoLocation}
              onValueChange={(value) => updateSetting('autoLocation', value)}
            />
          </View>

          {!settings.autoLocation && (
            <View>
              <ThemedText>Manual entry (Lat/Lon)</ThemedText>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 8,
                    padding: 8,
                    marginRight: 8,
                    color: textColor,
                    backgroundColor: bgColor
                  }}
                  keyboardType="numeric"
                  value={settings.manualLat}
                  onChangeText={(value) => updateSetting('manualLat', value)}
                  placeholder="Latitude"
                />
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 8,
                    padding: 8,
                    color: textColor,
                    backgroundColor: bgColor
                  }}
                  keyboardType="numeric"
                  value={settings.manualLon}
                  onChangeText={(value) => updateSetting('manualLon', value)}
                  placeholder="Longitude"
                />
              </View>
            </View>
          )}
        </ThemedView>

        {/* Sensor Settings */}
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
            <MaterialIcons name="sensors" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Sensor Settings
            </ThemedText>
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText>Smoothing filter strength</ThemedText>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              {[
                { label: "Low", value: "low" as const },
                { label: "Med", value: "med" as const },
                { label: "High", value: "high" as const }
              ].map(({ label, value }) => (
                <ThemedButton
                  key={value}
                  title={label}
                  onPress={() => updateSetting('smoothingStrength', value)}
                  variant={settings.smoothingStrength === value ? "primary" : "outline"}
                  style={{ flex: 1, marginHorizontal: 2 }}
                />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <ThemedText>Sensor debug overlay</ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Show sensor data on screen</ThemedText>
            </View>
            <Switch
              value={settings.debugOverlay}
              onValueChange={(value) => updateSetting('debugOverlay', value)}
            />
          </View>
        </ThemedView>

        {/* Mount Settings */}
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
            <MaterialIcons name="settings" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Mount Settings
            </ThemedText>
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText>Mount type</ThemedText>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              {[
                { label: "Dobsonian", value: "Dobsonian" as const },
                { label: "EQ simulated", value: "EQ" as const }
              ].map(({ label, value }) => (
                <ThemedButton
                  key={value}
                  title={label}
                  onPress={() => updateSetting('mountType', value)}
                  variant={settings.mountType === value ? "primary" : "outline"}
                  style={{ flex: 1, marginHorizontal: 2 }}
                />
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText>Finder mount offset (future)</ThemedText>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 8,
                padding: 8,
                marginTop: 4,
                color: textColor,
                backgroundColor: bgColor
              }}
              keyboardType="numeric"
              value={settings.finderOffset.toString()}
              onChangeText={(text) => updateSetting('finderOffset', parseFloat(text) || 0)}
              placeholder="0"
              editable={false} // future feature
            />
          </View>
        </ThemedView>

        {/* About */}
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
              About
            </ThemedText>
          </View>
          <ThemedText style={{ marginBottom: 8 }}>Star Tracker v1.0.0</ThemedText>
          <ThemedText style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>Instructions for phone calibration</ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            1. Place your phone flat on a stable surface. 2. Align the phone's orientation with north. 3. Calibrate sensors in the observe tab.
          </ThemedText>
          <ThemedText style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>Credits / Open source notice</ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
            Built with React Native and Expo. Open source under MIT license. Icons by Material Icons.
          </ThemedText>
        </ThemedView>

        {/* Data Management */}
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
            <MaterialIcons name="storage" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">
              Data Management
            </ThemedText>
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedButton
              title="Reset Settings"
              onPress={handleResetSettings}
              variant="outline"
            />
          </View>

          <ThemedButton
            title="Clear All Data"
            onPress={handleClearData}
            variant="outline"
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
