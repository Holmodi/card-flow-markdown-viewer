import { useState, useCallback, useRef, useEffect } from "react";
import Toolbar from "./components/Toolbar";
import TagFilter from "./components/TagFilter";
import CardGrid from "./components/CardGrid";
import CardDetail from "./components/CardDetail";
import SettingsPanel from "./components/SettingsPanel";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { useCardStore } from "./stores/cardStore";
import { createFile } from "./lib/tauri";

export default function App() {
  useTauriEvents();

  const currentDir = useCardStore((s) => s.currentDir);
  const selectedCard = useCardStore((s) => s.selectedCard);
  const addCards = useCardStore((s) => s.addCards);
  const setSelectedCard = useCardStore((s) => s.setSelectedCard);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!currentDir || !newFilename.trim()) return;
    const card = await createFile(currentDir, newFilename.trim());
    addCards([card]);
    setNewFilename("");
    setShowNewCard(false);
  }, [currentDir, newFilename, addCards]);

  const handleBackdropClick = useCallback(() => {
    setSelectedCard(null);
  }, [setSelectedCard]);

  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden relative">
      {/* 遮罩层 */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleBackdropClick}
        />
      )}
      <Toolbar showSettings={showSettings} onToggleSettings={() => setShowSettings(!showSettings)} />
      <TagFilter />

      {currentDir && (
        <div className="px-4 pt-3">
          {showNewCard ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="文件名（不含 .md）"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button onClick={handleCreate} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm cursor-pointer">创建</button>
              <button onClick={() => setShowNewCard(false)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm cursor-pointer">取消</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCard(true)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm cursor-pointer mb-2"
            >
              + 新建卡片
            </button>
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto min-w-0">
          <CardGrid />
        </div>
        <CardDetail />
      </div>

      {/* 设置面板 - 放在顶层 */}
      {showSettings && (
        <div ref={settingsRef} className="absolute right-4 top-14 z-[70]">
          <SettingsPanel />
        </div>
      )}
    </div>
  );
}
