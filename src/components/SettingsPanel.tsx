import { useCardStore } from "../stores/cardStore";
import { t, TranslationKey } from "../lib/i18n";
import type { Language } from "../types/settings";

// 映射 settings key 到翻译 key
const sliders: { key: TranslationKey; settingsKey: string; min: number; max: number; step: number }[] = [
  { key: "columnCount", settingsKey: "columnCount", min: 1, max: 5, step: 1 },
  { key: "titleFontSize", settingsKey: "titleFontSize", min: 12, max: 24, step: 1 },
  { key: "bodyFontSize", settingsKey: "bodyFontSize", min: 10, max: 20, step: 1 },
  { key: "titleLines", settingsKey: "titleLines", min: 1, max: 5, step: 1 },
  { key: "previewLines", settingsKey: "previewLines", min: 1, max: 10, step: 1 },
  { key: "scanDepth", settingsKey: "scanDepth", min: 0, max: 5, step: 1 },
];

export default function SettingsPanel() {
  const settings = useCardStore((s) => s.settings);
  const updateSettings = useCardStore((s) => s.updateSettings);
  const reloadCurrentDir = useCardStore((s) => s.reloadCurrentDir);
  const language = settings.language;

  const getScanDepthLabel = (value: number) => {
    if (value === 5) return t("unlimited", language);
    return `${value} ${t("layers", language)}`;
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ language: e.target.value as Language });
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl z-[60]">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">{t("displaySettings", language)}</h3>

      {/* 语言设置 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{t("language", language)}</span>
        </div>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200
            focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20
            transition-all duration-200 cursor-pointer"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>

      <div className="space-y-3">
        {sliders.map(({ key, settingsKey, min, max, step }) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t(key, language)}</span>
              <span>{key === "scanDepth" ? getScanDepthLabel(settings.scanDepth) : settings[settingsKey as keyof typeof settings]}{key !== "scanDepth" ? (settingsKey.includes("Size") ? "px" : settingsKey.includes("Lines") || settingsKey.includes("Count") ? "" : "") : ""}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={settings[settingsKey as keyof typeof settings] as number}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                updateSettings({ [settingsKey]: newValue });
                if (settingsKey === "scanDepth") {
                  reloadCurrentDir();
                }
              }}
              className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
