import { ThemedButton } from '@/components/ui/themed-button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import type { Eyepiece, Telescope } from '@/context/settings-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { Filter, useSettings } from '../../context/settings-context';

export default function SettingsScreen() {
  const tint = useThemeColor({}, "tint");
  const bgColor = useThemeColor({}, "background");
  const cardBgColor = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const errorColor = useThemeColor({}, "error");

  const { settings, updateSetting, resetSettings, addTelescope, addEyepieceToTelescope, deleteTelescope, removeEyepieceFromTelescope, addFilter, deleteFilter } = useSettings();

  // Local state for add forms
  const [showAddScope, setShowAddScope] = useState(false);
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeAperture, setNewScopeAperture] = useState('');
  const [newScopeFocal, setNewScopeFocal] = useState('');

  const [showAddEyepiece, setShowAddEyepiece] = useState(false);
  const [newEpName, setNewEpName] = useState('');
  const [newEpFocal, setNewEpFocal] = useState('');
  const [newEpAfov, setNewEpAfov] = useState('');

  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterType, setNewFilterType] = useState<Filter['type']>('other');
  const [newFilterDesc, setNewFilterDesc] = useState('');
  const [newFilterWavelength, setNewFilterWavelength] = useState('');
  const [newFilterBandwidth, setNewFilterBandwidth] = useState('');
  const [newFilterTransmission, setNewFilterTransmission] = useState('');

  const selectedScope = useMemo(() => settings.telescopes.find(t => t.id === settings.selectedTelescopeId) ?? settings.telescopes[0], [settings]);

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

  const handleAddScope = () => {
    if (!addTelescope) return;
    const aperture = parseFloat(newScopeAperture);
    const focal = parseFloat(newScopeFocal);
    if (!newScopeName || !aperture || !focal) {
      Alert.alert('Invalid scope', 'Please enter name, aperture (mm) and focal length (mm).');
      return;
    }
    const id = `tel_${Date.now().toString(36)}_${Math.round(Math.random()*1e6)}`;
    const scope: Telescope = { id, name: newScopeName.trim(), apertureMm: aperture, focalLengthMm: focal, eyepieces: [] };
    addTelescope(scope);
    setNewScopeName('');
    setNewScopeAperture('');
    setNewScopeFocal('');
    setShowAddScope(false);
  };

  const handleAddEyepiece = () => {
    if (!addEyepieceToTelescope || !selectedScope) return;
    const fl = parseFloat(newEpFocal);
    const af = newEpAfov ? parseFloat(newEpAfov) : undefined;
    if (!newEpName || !fl) {
      Alert.alert('Invalid eyepiece', 'Please enter name and focal length (mm).');
      return;
    }
    const id = `ep_${Date.now().toString(36)}_${Math.round(Math.random()*1e6)}`;
    const ep: Eyepiece = { id, name: newEpName.trim(), focalLengthMm: fl, apparentFovDeg: af };
    addEyepieceToTelescope(selectedScope.id, ep);
    setNewEpName('');
    setNewEpFocal('');
    setNewEpAfov('');
    setShowAddEyepiece(false);
  };

  const handleAddFilter = () => {
    if (!addFilter) return;
    if (!newFilterName) {
      Alert.alert('Invalid filter', 'Please enter filter name.');
      return;
    }
    const id = `filter_${Date.now().toString(36)}_${Math.round(Math.random()*1e6)}`;
    const filter: Filter = {
      id,
      name: newFilterName.trim(),
      type: newFilterType,
      description: newFilterDesc.trim() || undefined,
      centralWavelengthNm: newFilterWavelength ? parseFloat(newFilterWavelength) : undefined,
      bandwidthNm: newFilterBandwidth ? parseFloat(newFilterBandwidth) : undefined,
      transmissionPercent: newFilterTransmission ? parseFloat(newFilterTransmission) : undefined,
    };
    addFilter(filter);
    setNewFilterName('');
    setNewFilterType('other');
    setNewFilterDesc('');
    setNewFilterWavelength('');
    setNewFilterBandwidth('');
    setNewFilterTransmission('');
    setShowAddFilter(false);
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

          {/* Selected scope specs */}
          {selectedScope && (
            <ThemedText style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>
              {`${selectedScope.apertureMm}mm • ${selectedScope.focalLengthMm}mm (f/${Math.round((selectedScope.focalLengthMm / selectedScope.apertureMm) * 10) / 10})`}
            </ThemedText>
          )}

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

        {/* Optics: Telescopes & Eyepieces */}
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
            <ThemedText type="subtitle">Optics</ThemedText>
          </View>

          {/* Telescope selector - table style */}
          <ThemedText style={{ marginBottom: 8, fontWeight: '600' }}>Telescope</ThemedText>
          <View style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, overflow: 'hidden' }}>
            {settings.telescopes.map((scope, index) => {
              const isSelected = settings.selectedTelescopeId === scope.id;
              return (
                <View key={scope.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: isSelected ? tint + '20' : bgColor,
                  borderBottomWidth: index < settings.telescopes.length - 1 ? 1 : 0,
                  borderBottomColor: borderColor,
                }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: '600' }}>{scope.name}</ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                      {`${scope.apertureMm}mm • ${scope.focalLengthMm}mm (f/${Math.round((scope.focalLengthMm / scope.apertureMm) * 10) / 10})`}
                    </ThemedText>
                  </View>
                  <ThemedButton
                    title={isSelected ? 'Selected' : 'Select'}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => updateSetting('selectedTelescopeId', scope.id)}
                  />
                </View>
              );
            })}
          </View>

          {/* Add Telescope */}
          <View style={{ marginTop: 16 }}>
            <ThemedButton title={showAddScope ? 'Cancel Adding Telescope' : 'Add Telescope'} variant="outline" size="sm" onPress={() => setShowAddScope(v => !v)} />
            {selectedScope && deleteTelescope && settings.telescopes.length > 1 && (
              <ThemedButton title="Delete Selected Telescope" variant="outline" size="sm" onPress={() => {
                Alert.alert('Delete telescope', `Delete "${selectedScope.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteTelescope(selectedScope.id) }
                ]);
              }} style={{ marginLeft: 8 }} />
            )}
          </View>

          {showAddScope && (
            <View style={{ marginTop: 12, borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 12, backgroundColor: bgColor }}>
              <ThemedText style={{ marginBottom: 6, fontWeight: '600' }}>New Telescope</ThemedText>
              <TextInput
                style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginBottom: 6 }}
                placeholder="Name (e.g., 130/650 Newtonian)"
                value={newScopeName}
                onChangeText={setNewScopeName}
              />
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginRight: 6 }}
                  placeholder="Aperture (mm)"
                  keyboardType="numeric"
                  value={newScopeAperture}
                  onChangeText={setNewScopeAperture}
                />
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor }}
                  placeholder="Focal length (mm)"
                  keyboardType="numeric"
                  value={newScopeFocal}
                  onChangeText={setNewScopeFocal}
                />
              </View>
              <View style={{ marginTop: 8, flexDirection: 'row' }}>
                <ThemedButton title="Save" onPress={handleAddScope} size="sm" style={{ marginRight: 8 }} />
                <ThemedButton title="Cancel" variant="outline" size="sm" onPress={() => setShowAddScope(false)} />
              </View>
            </View>
          )}

          {/* Eyepieces for selected scope - table style */}
          {selectedScope && (
            <View style={{ marginTop: 16 }}>
              <ThemedText style={{ marginBottom: 8, fontWeight: '600' }}>Eyepiece</ThemedText>
              <View style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, overflow: 'hidden' }}>
                {selectedScope.eyepieces.map((ep, index) => {
                  const isSelected = settings.selectedEyepieceId === ep.id;
                  const magnification = Math.round((selectedScope.focalLengthMm / ep.focalLengthMm) * 10) / 10;
                  const tfov = ep.apparentFovDeg ? Math.round((ep.apparentFovDeg / magnification) * 10) / 10 : undefined;
                  return (
                    <View key={ep.id} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      backgroundColor: isSelected ? tint + '20' : bgColor,
                      borderBottomWidth: index < selectedScope.eyepieces.length - 1 ? 1 : 0,
                      borderBottomColor: borderColor,
                    }}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontWeight: '600' }}>{ep.name || `${ep.focalLengthMm}mm`}</ThemedText>
                        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                          {`${ep.focalLengthMm}mm`}{ep.apparentFovDeg ? ` • ${ep.apparentFovDeg}° AFOV` : ''} • {magnification}x{tfov ? ` • ${tfov}° TFOV` : ''}
                        </ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ThemedButton
                          title={isSelected ? 'Selected' : 'Select'}
                          variant={isSelected ? 'primary' : 'outline'}
                          size="sm"
                          onPress={() => updateSetting('selectedEyepieceId', ep.id)}
                          style={{ marginRight: 8 }}
                        />
                        <ThemedButton
                          accessibilityLabel={`Delete ${ep.name || `${ep.focalLengthMm}mm`}`}
                          variant="outline"
                          size="sm"
                          onPress={() => {
                            Alert.alert('Delete eyepiece', `Remove "${ep.name || `${ep.focalLengthMm}mm`}" from ${selectedScope.name}?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => removeEyepieceFromTelescope && removeEyepieceFromTelescope(selectedScope.id, ep.id) }
                            ]);
                          }}
                        >
                          <MaterialIcons name="delete" size={16} color={tint} />
                        </ThemedButton>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Add Eyepiece */}
          {selectedScope && (
            <View style={{ marginTop: 16 }}>
              <ThemedButton title={showAddEyepiece ? 'Cancel Adding Eyepiece' : 'Add Eyepiece'} variant="outline" size="sm" onPress={() => setShowAddEyepiece(v => !v)} />
            </View>
          )}

          {showAddEyepiece && selectedScope && (
            <View style={{ marginTop: 12, borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 12, backgroundColor: bgColor }}>
              <ThemedText style={{ marginBottom: 6, fontWeight: '600' }}>New Eyepiece for {selectedScope.name}</ThemedText>
              <TextInput
                style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginBottom: 6 }}
                placeholder="Name (e.g., 25mm Plössl)"
                value={newEpName}
                onChangeText={setNewEpName}
              />
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginRight: 6 }}
                  placeholder="Focal length (mm)"
                  keyboardType="numeric"
                  value={newEpFocal}
                  onChangeText={setNewEpFocal}
                />
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor }}
                  placeholder="AFOV (°) optional"
                  keyboardType="numeric"
                  value={newEpAfov}
                  onChangeText={setNewEpAfov}
                />
              </View>
              <View style={{ marginTop: 8, flexDirection: 'row' }}>
                <ThemedButton title="Save" onPress={handleAddEyepiece} size="sm" style={{ marginRight: 8 }} />
                <ThemedButton title="Cancel" variant="outline" size="sm" onPress={() => setShowAddEyepiece(false)} />
              </View>
            </View>
          )}
        </ThemedView>

        {/* Filters & Light Pollution */}
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
            <MaterialIcons name="filter-list" size={24} color={tint} style={{ marginRight: 8 }} />
            <ThemedText type="subtitle">Filters & Light Pollution</ThemedText>
          </View>

          {/* Light Pollution Level */}
          <ThemedText style={{ marginBottom: 8, fontWeight: '600' }}>Light Pollution Level</ThemedText>
          <View style={{ marginBottom: 16 }}>
            {[
              { label: 'None (Dark Sky)', value: 'none' as const },
              { label: 'Low (Rural)', value: 'low' as const },
              { label: 'Moderate (Suburban)', value: 'moderate' as const },
              { label: 'High (Urban)', value: 'high' as const },
              { label: 'Severe (City Center)', value: 'severe' as const },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 8,
                  marginBottom: 4,
                  backgroundColor: settings.lightPollutionLevel === option.value ? tint + '20' : bgColor,
                }}
                onPress={() => updateSetting('lightPollutionLevel', option.value)}
              >
                <ThemedText style={{ textAlign: 'center' }}>{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filter selector - table style */}
          <ThemedText style={{ marginBottom: 8, fontWeight: '600' }}>Filter</ThemedText>
          <View style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, overflow: 'hidden' }}>
            {settings.filters.map((filter, index) => (
              <TouchableOpacity
                key={filter.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: settings.selectedFilterId === filter.id ? tint + '20' : 'transparent',
                  borderBottomWidth: index < settings.filters.length - 1 ? 1 : 0,
                  borderBottomColor: borderColor,
                }}
                onPress={() => updateSetting('selectedFilterId', filter.id)}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: '500' }}>{filter.name}</ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                    {filter.type} {filter.description ? `• ${filter.description}` : ''}
                  </ThemedText>
                </View>
                {settings.filters.length > 1 && deleteFilter && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete Filter',
                        `Remove ${filter.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteFilter(filter.id)
                          }
                        ]
                      );
                    }}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons name="delete" size={20} color={errorColor} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Filter */}
          <View style={{ marginTop: 16 }}>
            <ThemedButton title={showAddFilter ? 'Cancel Adding Filter' : 'Add Filter'} variant="outline" size="sm" onPress={() => setShowAddFilter(v => !v)} />
          </View>

          {showAddFilter && (
            <View style={{ marginTop: 12, borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 12, backgroundColor: bgColor }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginBottom: 6 }}
                placeholder="Filter name (e.g., UHC-S)"
                value={newFilterName}
                onChangeText={setNewFilterName}
              />
              <View style={{ marginBottom: 6 }}>
                {[
                  { label: 'Broadband', value: 'broadband' as const },
                  { label: 'Narrowband', value: 'narrowband' as const },
                  { label: 'Line Filter', value: 'line' as const },
                  { label: 'Light Pollution', value: 'light_pollution' as const },
                  { label: 'Color', value: 'color' as const },
                  { label: 'Other', value: 'other' as const },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      padding: 8,
                      borderWidth: 1,
                      borderColor: borderColor,
                      borderRadius: 6,
                      marginBottom: 4,
                      backgroundColor: newFilterType === option.value ? tint + '20' : bgColor,
                    }}
                    onPress={() => setNewFilterType(option.value)}
                  >
                    <ThemedText style={{ textAlign: 'center', fontSize: 14 }}>{option.label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginBottom: 6 }}
                placeholder="Description (optional)"
                value={newFilterDesc}
                onChangeText={setNewFilterDesc}
              />
              {(newFilterType === 'narrowband' || newFilterType === 'line') && (
                <>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginBottom: 6 }}
                    placeholder="Central wavelength (nm)"
                    keyboardType="numeric"
                    value={newFilterWavelength}
                    onChangeText={setNewFilterWavelength}
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginBottom: 6 }}
                    placeholder="Bandwidth (nm)"
                    keyboardType="numeric"
                    value={newFilterBandwidth}
                    onChangeText={setNewFilterBandwidth}
                  />
                </>
              )}
              <TextInput
                style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, backgroundColor: bgColor, marginBottom: 6 }}
                placeholder="Transmission (%) optional"
                keyboardType="numeric"
                value={newFilterTransmission}
                onChangeText={setNewFilterTransmission}
              />
              <View style={{ marginTop: 8, flexDirection: 'row' }}>
                <ThemedButton title="Save" onPress={handleAddFilter} size="sm" style={{ marginRight: 8 }} />
                <ThemedButton title="Cancel" variant="outline" size="sm" onPress={() => setShowAddFilter(false)} />
              </View>
            </View>
          )}
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
