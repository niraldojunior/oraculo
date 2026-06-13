import { useState } from 'react';

const STORAGE_KEY = 'initiative_settings';

export interface InitiativeSettings {
  azureBaseUrl: string;
  helixBaseUrl: string;
}

const DEFAULT: InitiativeSettings = { azureBaseUrl: '', helixBaseUrl: '' };

function load(): InitiativeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function useInitiativeSettings() {
  const [settings, setSettings] = useState<InitiativeSettings>(load);

  const saveSettings = (next: InitiativeSettings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return { settings, saveSettings };
}

export function getInitiativeSettings(): InitiativeSettings {
  return load();
}
