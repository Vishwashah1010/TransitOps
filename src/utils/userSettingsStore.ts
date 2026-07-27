export interface UserSettings {
  activeTab: string;
  selectedVehicleId: string;
  isCommandMode: boolean;
  themeState: "dark" | "light" | "high-contrast";
  uiDensityPreset: "compact" | "comfortable" | "large";
  panelPreferences: {
    telemetryExpanded: boolean;
    diagnosticsView: "logs" | "predictive" | "playback";
    showAssistantWidget: boolean;
    compactView: boolean;
    autoRefreshIntervalMs: number;
  };
  sidebarCollapsedGroups: Record<string, boolean>;
}

const STORAGE_KEY = "transitops_workspace_user_settings_v1";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  activeTab: "fleet",
  selectedVehicleId: "",
  isCommandMode: false,
  themeState: "dark",
  uiDensityPreset: "comfortable",
  panelPreferences: {
    telemetryExpanded: true,
    diagnosticsView: "logs",
    showAssistantWidget: false,
    compactView: false,
    autoRefreshIntervalMs: 10000,
  },
  sidebarCollapsedGroups: {
    "Fleet Operations": false,
    "Analytics": false,
    "Admin Utilities": false,
  },
};

export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      panelPreferences: {
        ...DEFAULT_USER_SETTINGS.panelPreferences,
        ...(parsed.panelPreferences || {}),
      },
      sidebarCollapsedGroups: {
        ...DEFAULT_USER_SETTINGS.sidebarCollapsedGroups,
        ...(parsed.sidebarCollapsedGroups || {}),
      },
    };
  } catch (err) {
    console.warn("Failed to load user settings from localStorage:", err);
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveUserSettings(updated: Partial<UserSettings>): UserSettings {
  try {
    const current = loadUserSettings();
    const merged: UserSettings = {
      ...current,
      ...updated,
      panelPreferences: {
        ...current.panelPreferences,
        ...(updated.panelPreferences || {}),
      },
      sidebarCollapsedGroups: {
        ...current.sidebarCollapsedGroups,
        ...(updated.sidebarCollapsedGroups || {}),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn("Failed to save user settings to localStorage:", err);
    return DEFAULT_USER_SETTINGS;
  }
}
