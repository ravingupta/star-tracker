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
};

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
};

type SettingsState = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  isLoading: boolean;
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

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value: SettingsState = {
    settings,
    updateSetting,
    resetSettings,
    isLoading,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
