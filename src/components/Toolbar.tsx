import { useState, useEffect } from "react";
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

export interface RecentFolderButtonProps {
  onToggle: () => void;
  isOpen: boolean;
}

export function RecentFolderButton({ onToggle, isOpen }: RecentFolderButtonProps) {
  const recentDirs = useCardStore((s) => s.recentDirs);
  const isScanning = useCardStore((s) => s.isScanning);

  return (
    <button
      onClick={onToggle}
      disabled={isScanning || recentDirs.length === 0}
      className={`px-3 py-2 border rounded-xl text-sm transition-all duration-200 cursor-pointer ${
        isOpen
          ? "bg-primary-600 border-primary-500 text-white"
          : "bg-slate-800/80 border-slate-700 hover:bg-slate-700 hover:text-white"
      } disabled:opacity-50`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}

export default function Toolbar({ onRecentFolderToggle, isRecentFolderOpen }: { onRecentFolderToggle?: () => void; isRecentFolderOpen?: boolean }) {
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
  const language = settings.language;

  // 点击外部关闭下拉菜单 - 通过 props 传递的回调处理
  useEffect(() => {
    if (!isRecentFolderOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      // 点击最近文件夹按钮不关闭（由父组件处理）
      const target = e.target as HTMLElement;
      if (target.closest('[data-recent-folder-btn="true"]')) {
        return;
      }
      if (onRecentFolderToggle) {
        onRecentFolderToggle();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isRecentFolderOpen, onRecentFolderToggle]);

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
            {t("scanning", language)}
          </span>
        ) : (
          t("openFolder", language)
        )}
      </button>

      {/* 最近文件夹按钮 - 由父组件控制 */}
      <div data-recent-folder-btn="true">
        <RecentFolderButton
          onToggle={() => onRecentFolderToggle?.()}
          isOpen={isRecentFolderOpen || false}
        />
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
