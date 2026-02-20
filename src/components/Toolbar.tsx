import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useCardStore } from "../stores/cardStore";
import { scanDirectory } from "../lib/tauri";
import type { SortBy } from "../types/card";

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
  const settings = useCardStore((s) => s.settings);

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

  const handleOpenFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      clearCards();
      setSearchQuery("");
      setCurrentDir(selected);
      setIsScanning(true);
      await scanDirectory(selected, settings.scanDepth);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
      <button
        onClick={handleOpenFolder}
        disabled={isScanning}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50
          text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-600/20
          transition-all duration-200 cursor-pointer"
      >
        {isScanning ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            扫描中...
          </span>
        ) : (
          "打开文件夹"
        )}
      </button>

      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder="搜索卡片..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200
            placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20
            transition-all duration-200"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortBy)}
        className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200
          focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20
          transition-all duration-200 cursor-pointer"
      >
        <option value="title">标题</option>
        <option value="created">创建时间</option>
        <option value="updated">更新时间</option>
        <option value="size">大小</option>
      </select>

      <button
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-300
          hover:bg-slate-700 hover:text-white hover:border-slate-600
          transition-all duration-200 cursor-pointer"
      >
        {sortOrder === "asc" ? "↑" : "↓"}
      </button>
    </div>
  );
}
