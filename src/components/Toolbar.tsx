import { useState, useRef, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useCardStore } from "../stores/cardStore";
import { scanDirectory } from "../lib/tauri";
import type { SortBy } from "../types/card";
import SettingsPanel from "./SettingsPanel";

// 防抖 hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function Toolbar() {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const searchQuery = useCardStore((s) => s.searchQuery);
  const setSearchQuery = useCardStore((s) => s.setSearchQuery);
  const sortBy = useCardStore((s) => s.sortBy);
  const setSortBy = useCardStore((s) => s.setSortBy);
  const sortOrder = useCardStore((s) => s.sortOrder);
  const setSortOrder = useCardStore((s) => s.setSortOrder);
  const isScanning = useCardStore((s) => s.isScanning);
  const setIsScanning = useCardStore((s) => s.setIsScanning);
  const setCurrentDir = useCardStore((s) => s.setCurrentDir);
  const clearCards = useCardStore((s) => s.clearCards);
  const cards = useCardStore((s) => s.cards);

  // 搜索防抖（300ms 延迟）
  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedSearch = useDebounce(inputValue, 300);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      setSearchQuery(debouncedSearch);
    }
  }, [debouncedSearch, searchQuery, setSearchQuery]);

  useEffect(() => {
    if (searchQuery !== inputValue) {
      setInputValue(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  const handleOpenFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      clearCards();
      setSearchQuery("");
      setCurrentDir(selected);
      setIsScanning(true);
      await scanDirectory(selected);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
      <button
        onClick={handleOpenFolder}
        disabled={isScanning}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium shrink-0 cursor-pointer"
      >
        {isScanning ? "扫描中..." : "打开文件夹"}
      </button>

      <input
        type="text"
        placeholder="搜索卡片..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortBy)}
        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
      >
        <option value="title">标题</option>
        <option value="created">创建时间</option>
        <option value="updated">更新时间</option>
        <option value="size">大小</option>
      </select>

      <button
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 hover:bg-slate-700 cursor-pointer"
      >
        {sortOrder === "asc" ? "↑" : "↓"}
      </button>

      <span className="text-xs text-slate-400 shrink-0">{cards.size} 张卡片</span>

      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 hover:bg-slate-700 cursor-pointer"
          title="显示设置"
        >
          ⚙
        </button>
        {showSettings && <SettingsPanel />}
      </div>
    </div>
  );
}
