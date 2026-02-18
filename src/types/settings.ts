export interface DisplaySettings {
  cardWidth: number;
  titleFontSize: number;
  bodyFontSize: number;
  titleLines: number;
  previewLines: number;
}

export const defaultSettings: DisplaySettings = {
  cardWidth: 280,
  titleFontSize: 14,
  bodyFontSize: 12,
  titleLines: 2,
  previewLines: 4,
};
