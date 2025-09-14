import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Settings = {
  flipAltitude: boolean;
  headingOffset: number;
  useTrueNorth: boolean;
  autoLocation: boolean;
  manualLat: string;
  manualLon: string;
  smoothingStrength: 'low' | 'med' | 'high';
  debugOverlay: boolean;
  mountType: 'Dobsonian' | 'EQ';
  finderOffset: number;
  // Optics: user-configured telescopes and eyepieces
  telescopes: Telescope[];
  selectedTelescopeId?: string;
  selectedEyepieceId?: string;
  // Filters
  filters: Filter[];
  selectedFilterId?: string;
  // Light pollution level
  lightPollutionLevel: LightPollutionLevel;
};

export type Eyepiece = {
  id: string;
  name: string; // e.g., "25mm Plössl"
  focalLengthMm: number; // eyepiece focal length
  apparentFovDeg?: number; // optional AFOV degrees
};

export type Telescope = {
  id: string;
  name: string; // e.g., "130/650 Newtonian"
  apertureMm: number;
  focalLengthMm: number;
  eyepieces: Eyepiece[];
};

export type Filter = {
  id: string;
  name: string; // e.g., "UHC-S"
  type: 'broadband' | 'narrowband' | 'line' | 'light_pollution' | 'color' | 'other';
  description?: string; // optional description
  // For narrowband/line filters, the central wavelength in nm
  centralWavelengthNm?: number;
  // Bandwidth in nm for narrowband filters
  bandwidthNm?: number;
  // Transmission percentage (0-100)
  transmissionPercent?: number;
};

export type LightPollutionLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe';

const defaultSettings: Settings = {
  flipAltitude: false,
  headingOffset: 0,
  useTrueNorth: true,
  autoLocation: true,
  manualLat: '',
  manualLon: '',
  smoothingStrength: 'med',
  debugOverlay: false,
  mountType: 'Dobsonian',
  finderOffset: 0,
  telescopes: [
    {
      id: 'tel_default_130_650',
      name: '130/650 Newtonian',
      apertureMm: 130,
      focalLengthMm: 650,
      eyepieces: [
        { id: 'ep_25_68', name: '25mm', focalLengthMm: 25, apparentFovDeg: 60 },
        { id: 'ep_10_68', name: '10mm', focalLengthMm: 10, apparentFovDeg: 60 },
        { id: 'ep_5_60', name: '5mm', focalLengthMm: 5, apparentFovDeg: 60 },
      ],
    },
  ],
  selectedTelescopeId: 'tel_default_130_650',
  selectedEyepieceId: 'ep_25_68',
  filters: [
    { id: 'filter_none', name: 'No Filter', type: 'other', description: 'No filter applied' },
    { id: 'filter_uhc', name: 'UHC-S', type: 'narrowband', description: 'Ultra High Contrast Sulfur filter', centralWavelengthNm: 656, bandwidthNm: 30, transmissionPercent: 85 },
    { id: 'filter_oiii', name: 'OIII', type: 'line', description: 'Oxygen III filter', centralWavelengthNm: 501, bandwidthNm: 3, transmissionPercent: 90 },
    { id: 'filter_h_beta', name: 'H-Beta', type: 'line', description: 'Hydrogen Beta filter', centralWavelengthNm: 486, bandwidthNm: 3, transmissionPercent: 90 },
    { id: 'filter_light_pollution', name: 'Light Pollution', type: 'light_pollution', description: 'Blocks sodium/mercury streetlights', transmissionPercent: 70 },
  ],
  selectedFilterId: 'filter_none',
  lightPollutionLevel: 'moderate',
};

type SettingsState = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  isLoading: boolean;
  addTelescope?: (telescope: Telescope) => void;
  deleteTelescope?: (telescopeId: string) => void;
  addEyepieceToTelescope?: (telescopeId: string, eyepiece: Eyepiece) => void;
  removeEyepieceFromTelescope?: (telescopeId: string, eyepieceId: string) => void;
  addFilter?: (filter: Filter) => void;
  deleteFilter?: (filterId: string) => void;
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const SETTINGS_KEY = 'startracker_settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          // Merge with defaults to handle new settings
          setSettings({ ...defaultSettings, ...parsedSettings });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to AsyncStorage whenever settings change
  useEffect(() => {
    if (!isLoading) {
      const saveSettings = async () => {
        try {
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
      };
      saveSettings();
    }
  }, [settings, isLoading]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Convenience helpers to manage optics
  const addTelescope = (telescope: Telescope) => {
    setSettings(prev => ({
      ...prev,
      telescopes: [...prev.telescopes, telescope],
      selectedTelescopeId: telescope.id,
      // if new scope has eyepieces, preselect the first
      selectedEyepieceId: telescope.eyepieces[0]?.id ?? prev.selectedEyepieceId,
    }));
  };

  const deleteTelescope = (telescopeId: string) => {
    setSettings(prev => {
      const remaining = prev.telescopes.filter(t => t.id !== telescopeId);
      const wasSelected = prev.selectedTelescopeId === telescopeId;
      return {
        ...prev,
        telescopes: remaining,
        selectedTelescopeId: wasSelected ? remaining[0]?.id : prev.selectedTelescopeId,
        selectedEyepieceId: wasSelected ? remaining[0]?.eyepieces[0]?.id : prev.selectedEyepieceId,
      };
    });
  };

  const addEyepieceToTelescope = (telescopeId: string, eyepiece: Eyepiece) => {
    setSettings(prev => {
      const telescopes = prev.telescopes.map(t =>
        t.id === telescopeId ? { ...t, eyepieces: [...t.eyepieces, eyepiece] } : t
      );
      return {
        ...prev,
        telescopes,
        selectedTelescopeId: telescopeId,
        selectedEyepieceId: eyepiece.id,
      };
    });
  };

  const removeEyepieceFromTelescope = (telescopeId: string, eyepieceId: string) => {
    setSettings(prev => {
      const telescopes = prev.telescopes.map(t =>
        t.id === telescopeId ? { ...t, eyepieces: t.eyepieces.filter(e => e.id !== eyepieceId) } : t
      );
      const deselect = prev.selectedEyepieceId === eyepieceId;
      const selectedScope = telescopes.find(t => t.id === telescopeId);
      return {
        ...prev,
        telescopes,
        selectedEyepieceId: deselect ? selectedScope?.eyepieces[0]?.id : prev.selectedEyepieceId,
      };
    });
  };

  const addFilter = (filter: Filter) => {
    setSettings(prev => ({
      ...prev,
      filters: [...prev.filters, filter],
      selectedFilterId: filter.id,
    }));
  };

  const deleteFilter = (filterId: string) => {
    setSettings(prev => {
      const remaining = prev.filters.filter(f => f.id !== filterId);
      const wasSelected = prev.selectedFilterId === filterId;
      return {
        ...prev,
        filters: remaining,
        selectedFilterId: wasSelected ? remaining[0]?.id : prev.selectedFilterId,
      };
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value: SettingsState = {
  settings,
  updateSetting,
  resetSettings,
  isLoading,
  addTelescope,
  deleteTelescope,
  addEyepieceToTelescope,
  removeEyepieceFromTelescope,
  addFilter,
  deleteFilter,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
