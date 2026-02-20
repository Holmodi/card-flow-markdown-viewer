export type TimezoneOffset = "UTC" | "UTC+8" | "UTC+9" | "UTC-5";

export interface UserPreferences {
  timezone: TimezoneOffset;
}

export interface DisplaySettings extends UserPreferences {
  columnCount: number;
  detailWidth: number;
  titleFontSize: number;
  bodyFontSize: number;
  titleLines: number;
  previewLines: number;
  scanDepth: number;
}

export const defaultSettings: DisplaySettings = {
  timezone: "UTC+8",
  columnCount: 4,
  detailWidth: 700,
  titleFontSize: 14,
  bodyFontSize: 12,
  titleLines: 2,
  previewLines: 4,
  scanDepth: 3,
};
