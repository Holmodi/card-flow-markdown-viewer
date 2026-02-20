import { useState, useCallback, useRef, useEffect } from "react";
import Toolbar from "./components/Toolbar";
import TagFilter from "./components/TagFilter";
import CardGrid from "./components/CardGrid";
import CardDetail from "./components/CardDetail";
import SettingsPanel from "./components/SettingsPanel";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { useCardStore } from "./stores/cardStore";
import { createFile, deleteFile, scanDirectory } from "./lib/tauri";
import { t } from "./lib/i18n";
import { useCardFilter } from "./hooks/useCardFilter";

function generateTimestampFilename(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mmVal = String(now.getMinutes()).padStart(2, "0");
  return `${yy}-${mm}.${dd}-${HH}${mmVal}`;
}

export default function App() {
  useTauriEvents();

  const currentDir = useCardStore((s) => s.currentDir);
  const selectedCard = useCardStore((s) => s.selectedCard);
  const addCards = useCardStore((s) => s.addCards);
  const setSelectedCard = useCardStore((s) => s.setSelectedCard);
  const loadLastDir = useCardStore((s) => s.loadLastDir);
  const reloadCurrentDir = useCardStore((s) => s.reloadCurrentDir);
  const removeCard = useCardStore((s) => s.removeCard);
  const deleteConfirmPath = useCardStore((s) => s.deleteConfirmPath);
  const setDeleteConfirmPath = useCardStore((s) => s.setDeleteConfirmPath);
  const editing = useCardStore((s) => s.isEditing);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecentFolders, setShowRecentFolders] = useState(false);
  const hasInitialScan = useRef(false);

  // 最近文件夹相关状态和函数
  const setSearchQuery = useCardStore((s) => s.setSearchQuery);
  const setCurrentDir = useCardStore((s) => s.setCurrentDir);
  const setIsScanning = useCardStore((s) => s.setIsScanning);
  const clearCards = useCardStore((s) => s.clearCards);
  const settings = useCardStore((s) => s.settings);

  const handleOpenRecentFolder = useCallback(async (dir: string) => {
    clearCards();
    setSearchQuery("");
    setCurrentDir(dir);
    setIsScanning(true);
    await scanDirectory(dir, settings.scanDepth);
    setShowRecentFolders(false);
  }, [clearCards, setSearchQuery, setCurrentDir, setIsScanning, settings.scanDepth]);

  const handleCreate = useCallback(async () => {
    if (!currentDir) return;
    const filename = generateTimestampFilename();
    const card = await createFile(currentDir, filename);
    addCards([card]);
  }, [currentDir, addCards]);

  // 计算过滤后的卡片数据（用于状态栏显示）
  const filteredCards = useCardFilter();

  const handleRefresh = useCallback(() => {
    reloadCurrentDir();
  }, [reloadCurrentDir]);

  const handleBackdropClick = useCallback(() => {
    // 编辑模式下点击遮罩层不关闭
    if (!editing) {
      setSelectedCard(null);
    }
  }, [setSelectedCard, editing]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmPath) {
      await deleteFile(deleteConfirmPath);
      removeCard(deleteConfirmPath);
      setDeleteConfirmPath(null);
    }
  }, [deleteConfirmPath, removeCard, setDeleteConfirmPath]);

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

  // 启动时自动加载上次文件夹
  useEffect(() => {
    if (!hasInitialScan.current) {
      hasInitialScan.current = true;
      loadLastDir();
    }
  }, [loadLastDir]);

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden relative">
      {/* 遮罩层 */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* 按钮区域 - 右上角 */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {currentDir && (
          <button
            onClick={handleCreate}
            className="p-2 bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 rounded-xl transition-all duration-200 cursor-pointer"
            title="新建卡片"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        <button
          onClick={handleRefresh}
          className="p-2 bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 rounded-xl transition-all duration-200 cursor-pointer"
          title="刷新视图"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl transition-all duration-200 cursor-pointer
            ${showSettings
              ? "bg-primary-600 text-white"
              : "bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
          }`}
          title="显示设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <Toolbar
        onRecentFolderToggle={() => setShowRecentFolders(!showRecentFolders)}
        isRecentFolderOpen={showRecentFolders}
      />
      <TagFilter />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 pt-8 pr-8">
            <CardGrid />
          </div>
        </div>
      </div>

      <CardDetail />

      {/* 设置面板 - 放在顶层 */}
      {showSettings && (
        <div ref={settingsRef} className="absolute right-4 top-14 z-[70]">
          <SettingsPanel />
        </div>
      )}

      {/* 最近文件夹面板 - 全局渲染，不受 CardGrid 层叠影响 */}
      {showRecentFolders && (
        <RecentFoldersPanel
          onClose={() => setShowRecentFolders(false)}
          onSelectFolder={handleOpenRecentFolder}
        />
      )}

      {/* 状态栏 - 悬浮在右下角 */}
      <StatusBar totalCards={filteredCards.length} />

      {/* 全局删除确认对话框 */}
      {deleteConfirmPath && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-80">
            <h3 className="text-lg font-semibold text-white mb-2">确认删除</h3>
            <p className="text-slate-400 mb-4">确定删除这张卡片？此操作无法撤销。</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmPath(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-primary-600/20 transition-all cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 最近文件夹面板 - 全局渲染，不受 CardGrid 层叠影响
function RecentFoldersPanel({ onClose, onSelectFolder }: { onClose: () => void; onSelectFolder: (dir: string) => void }) {
  const recentDirs = useCardStore((s) => s.recentDirs);
  const clearRecentDirs = useCardStore((s) => s.clearRecentDirs);
  const settings = useCardStore((s) => s.settings);
  const language = settings.language;
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="fixed w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[100] max-h-80 overflow-y-auto"
      style={{ top: "60px", left: "120px" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2">
        <div className="text-xs text-slate-400 px-2 py-1">{t("recentFolders", language)}</div>
        {recentDirs.length === 0 ? (
          <div className="text-sm text-slate-500 px-2 py-2">{t("noRecentFolders", language)}</div>
        ) : (
          <>
            {recentDirs.map((dir, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFolder(dir);
                }}
                className="w-full text-left px-2 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg truncate transition-colors cursor-pointer"
                title={dir}
              >
                {dir}
              </button>
            ))}
            <button
              onClick={() => {
                clearRecentDirs();
                onClose();
              }}
              className="w-full text-left px-2 py-2 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {t("clearRecent", language)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 状态栏组件 - 悬浮在右下角，不挤占正文空间
function StatusBar({ totalCards }: { totalCards: number }) {
  const selectedCard = useCardStore((s) => s.selectedCard);
  const currentWordCount = useCardStore((s) => s.currentWordCount);
  const settings = useCardStore((s) => s.settings);
  const language = settings.language;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-center gap-3 px-3 py-1.5 bg-slate-800/90 backdrop-blur-md border-t border-slate-700/50 rounded-xl text-xs text-slate-400">
      {selectedCard ? (
        <>
          <span className="text-slate-600">|</span>
          <span>{currentWordCount.toLocaleString()} {t("words", language)}</span>
          <span className="text-slate-600">|</span>
          <span>{totalCards} {t("cards", language)}</span>
        </>
      ) : (
        <span>{totalCards} {t("cards", language)}</span>
      )}
    </div>
  );
}
