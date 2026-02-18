import { create } from "zustand";
import type { CardMeta, SortBy, SortOrder } from "../types/card";
import type { DisplaySettings } from "../types/settings";
import { defaultSettings } from "../types/settings";

function loadSettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem("card-flow-settings");
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
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
}

export const useCardStore = create<CardStore>((set) => ({
  cards: new Map(),
  searchQuery: "",
  selectedTags: [],
  sortBy: "title",
  sortOrder: "asc",
  selectedCard: null,
  isScanning: false,
  currentDir: null,
  settings: loadSettings(),

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
  setCurrentDir: (currentDir) => set({ currentDir }),
  clearCards: () => set({ cards: new Map(), selectedCard: null }),
  updateSettings: (partial) =>
    set((state) => {
      const next = { ...state.settings, ...partial };
      localStorage.setItem("card-flow-settings", JSON.stringify(next));
      return { settings: next };
    }),
}));
