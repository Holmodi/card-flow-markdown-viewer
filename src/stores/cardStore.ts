import { create } from "zustand";
import type { CardMeta, SortBy, SortOrder } from "../types/card";
import type { DisplaySettings } from "../types/settings";
import { defaultSettings } from "../types/settings";
import { scanDirectory } from "../lib/tauri";

function loadSettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem("card-flow-settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        timezone: defaultSettings.timezone,
        language: defaultSettings.language,
        columnCount: defaultSettings.columnCount,
        detailWidth: defaultSettings.detailWidth,
        titleFontSize: defaultSettings.titleFontSize,
        bodyFontSize: defaultSettings.bodyFontSize,
        titleLines: defaultSettings.titleLines,
        previewLines: defaultSettings.previewLines,
        scanDepth: defaultSettings.scanDepth,
        ...parsed,
      };
    }
  } catch {}
  return defaultSettings;
}

function loadRecentDirs(): string[] {
  try {
    const raw = localStorage.getItem("card-flow-recent-dirs");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function loadLastDir(): string | null {
  try {
    return localStorage.getItem("card-flow-last-dir");
  } catch {
    return null;
  }
}

interface CardStore {
  cards: Map<string, CardMeta>;
  searchQuery: string;
  selectedTags: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  selectedCard: string | null;
  isScanning: boolean;
  currentDir: string | null;
  settings: DisplaySettings;
  recentDirs: string[];
  deleteConfirmPath: string | null;
  isEditing: boolean;
  currentWordCount: number;

  addCards: (cards: CardMeta[]) => void;
  updateCard: (card: CardMeta) => void;
  removeCard: (path: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setSelectedCard: (path: string | null) => void;
  setIsScanning: (scanning: boolean) => void;
  setCurrentDir: (dir: string) => void;
  clearCards: () => void;
  updateSettings: (partial: Partial<DisplaySettings>) => void;
  loadLastDir: () => void;
  reloadCurrentDir: () => void;
  addRecentDir: (dir: string) => void;
  clearRecentDirs: () => void;
  setDeleteConfirmPath: (path: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  setWordCount: (count: number) => void;
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: new Map(),
  searchQuery: "",
  selectedTags: [],
  sortBy: "created",
  sortOrder: "desc",
  selectedCard: null,
  isScanning: false,
  currentDir: loadLastDir(),
  settings: loadSettings(),
  recentDirs: loadRecentDirs(),
  deleteConfirmPath: null,
  isEditing: false,
  currentWordCount: 0,

  addCards: (cards) =>
    set((state) => {
      const next = new Map(state.cards);
      for (const card of cards) {
        next.set(card.path, card);
      }
      return { cards: next };
    }),

  updateCard: (card) =>
    set((state) => {
      const next = new Map(state.cards);
      next.set(card.path, card);
      return { cards: next };
    }),

  removeCard: (path) =>
    set((state) => {
      const next = new Map(state.cards);
      next.delete(path);
      return { cards: next, selectedCard: state.selectedCard === path ? null : state.selectedCard };
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTags: (selectedTags) => set({ selectedTags }),
  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setSelectedCard: (selectedCard) => set({ selectedCard }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setCurrentDir: (currentDir) => {
    if (currentDir) {
      localStorage.setItem("card-flow-last-dir", currentDir);
      // 添加到最近文件夹
      const { recentDirs } = get();
      const filtered = recentDirs.filter((d) => d !== currentDir);
      const updated = [currentDir, ...filtered].slice(0, 10);
      localStorage.setItem("card-flow-recent-dirs", JSON.stringify(updated));
      set({ currentDir, recentDirs: updated });
    }
  },
  clearCards: () => set({ cards: new Map(), selectedCard: null }),
  updateSettings: (partial) =>
    set((state) => {
      const next = { ...state.settings, ...partial };
      localStorage.setItem("card-flow-settings", JSON.stringify(next));
      return { settings: next };
    }),
  loadLastDir: () => {
    const lastDir = loadLastDir();
    if (lastDir) {
      const settings = loadSettings();
      set({ currentDir: lastDir });
      scanDirectory(lastDir, settings.scanDepth);
    }
  },
  reloadCurrentDir: () => {
    const { currentDir, settings } = get();
    if (currentDir) {
      set({ isScanning: true });
      set({ cards: new Map(), selectedCard: null });
      scanDirectory(currentDir, settings.scanDepth);
    }
  },
  addRecentDir: (dir: string) => {
    const { recentDirs } = get();
    // 移除已存在的路径并添加到最前面
    const filtered = recentDirs.filter((d) => d !== dir);
    const updated = [dir, ...filtered].slice(0, 10); // 保留最多10个
    localStorage.setItem("card-flow-recent-dirs", JSON.stringify(updated));
    set({ recentDirs: updated });
  },
  clearRecentDirs: () => {
    localStorage.setItem("card-flow-recent-dirs", "[]");
    set({ recentDirs: [] });
  },
  setDeleteConfirmPath: (path) => set({ deleteConfirmPath: path }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setWordCount: (count) => set({ currentWordCount: count }),
}));
