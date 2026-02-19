import { useCardStore } from "../stores/cardStore";
import type { DisplaySettings } from "../types/settings";

const sliders: { key: keyof DisplaySettings; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "columnCount", label: "显示列数", min: 1, max: 5, step: 1, unit: "列" },
  { key: "titleFontSize", label: "标题字号", min: 12, max: 24, step: 1, unit: "px" },
  { key: "bodyFontSize", label: "正文字号", min: 10, max: 20, step: 1, unit: "px" },
  { key: "titleLines", label: "标题行数", min: 1, max: 5, step: 1, unit: "行" },
  { key: "previewLines", label: "预览行数", min: 1, max: 10, step: 1, unit: "行" },
];

export default function SettingsPanel() {
  const settings = useCardStore((s) => s.settings);
  const updateSettings = useCardStore((s) => s.updateSettings);

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl z-[60]">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">显示设置</h3>
      <div className="space-y-3">
        {sliders.map(({ key, label, min, max, step, unit }) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{label}</span>
              <span>{settings[key]}{unit}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={settings[key]}
              onChange={(e) => updateSettings({ [key]: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
