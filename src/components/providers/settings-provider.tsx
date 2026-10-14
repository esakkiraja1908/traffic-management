"use client";

import * as React from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "@/lib/api-client";
import type { PlatformSettings } from "@/types/traffic";

interface SettingsContextValue {
  settings: PlatformSettings;
  hydrated: boolean;
  updateSettings: (patch: Partial<PlatformSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) {
      document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
    }
  }, [hydrated, settings.reducedMotion]);

  const updateSettings = React.useCallback((patch: Partial<PlatformSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = React.useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  const value = React.useMemo(
    () => ({ settings, hydrated, updateSettings, resetSettings }),
    [settings, hydrated, updateSettings, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = React.useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
}
