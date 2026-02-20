import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useCardStore } from "../stores/cardStore";
import { scanDirectory } from "../lib/tauri";
import { t } from "../lib/i18n";
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
  const recentDirs = useCardStore((s) => s.recentDirs);
  const clearRecentDirs = useCardStore((s) => s.clearRecentDirs);
  const language = settings.language;

  // 最近文件夹下拉菜单状态
  const [showRecent, setShowRecent] = useState(false);
  const recentMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recentMenuRef.current && !recentMenuRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    if (showRecent) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showRecent]);

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

  const handleOpenRecentFolder = async (dir: string) => {
    clearCards();
    setSearchQuery("");
    setCurrentDir(dir);
    setIsScanning(true);
    await scanDirectory(dir, settings.scanDepth);
    setShowRecent(false);
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
            {t("scanning", language)}
          </span>
        ) : (
          t("openFolder", language)
        )}
      </button>

      {/* 最近文件夹下拉菜单 */}
      <div className="relative" ref={recentMenuRef}>
        <button
          onClick={() => setShowRecent(!showRecent)}
          disabled={isScanning || recentDirs.length === 0}
          className="px-3 py-2 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:text-white
            disabled:opacity-50 rounded-xl text-sm text-slate-300 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {showRecent && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-slate-400 px-2 py-1">{t("recentFolders", language)}</div>
              {recentDirs.length === 0 ? (
                <div className="text-sm text-slate-500 px-2 py-2">{t("noRecentFolders", language)}</div>
              ) : (
                <>
                  {recentDirs.map((dir, index) => (
                    <button
                      key={index}
                      onClick={() => handleOpenRecentFolder(dir)}
                      className="w-full text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg truncate transition-colors cursor-pointer"
                      title={dir}
                    >
                      {dir}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      clearRecentDirs();
                      setShowRecent(false);
                    }}
                    className="w-full text-left px-2 py-2 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {t("clearRecent", language)}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder={t("searchPlaceholder", language)}
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
        <option value="title">{t("sortTitle", language)}</option>
        <option value="created">{t("sortCreated", language)}</option>
        <option value="updated">{t("sortUpdated", language)}</option>
        <option value="size">{t("sortSize", language)}</option>
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
