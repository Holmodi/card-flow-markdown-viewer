import { useMemo, useRef, useState, useEffect } from "react";
import { useCardFilter } from "../hooks/useCardFilter";
import CardItem from "./CardItem";
import EmptyState from "./EmptyState";
import { useCardStore } from "../stores/cardStore";
import { useWindowSize } from "./useWindowSize";

export default function CardGrid() {
  const filteredCards = useCardFilter();
  const isScanning = useCardStore((s) => s.isScanning);
  const currentDir = useCardStore((s) => s.currentDir);
  const selectedTags = useCardStore((s) => s.selectedTags);
  const searchQuery = useCardStore((s) => s.searchQuery);
  const cards = useCardStore((s) => s.cards);
  const cardWidth = useCardStore((s) => s.settings.cardWidth);
  const windowSize = useWindowSize();

  if (!currentDir) {
    return <EmptyState message="点击「打开文件夹」选择一个包含 .md 文件的目录" />;
  }

  const hasFilter = searchQuery.trim().length > 0 || selectedTags.length > 0;

  if (filteredCards.length === 0 && !isScanning) {
    if (hasFilter) {
      return <EmptyState message="没有找到匹配的卡片" />;
    }
    if (cards.size === 0) {
      return <EmptyState message="该目录下没有 .md 文件" />;
    }
  }

  // 计算列数（每列宽度 = cardWidth + gap）
  const gap = 16;
  const columnWidth = cardWidth + gap;
  const columnCount = Math.max(1, Math.floor(windowSize.width / columnWidth));

  // 将卡片分配到各列
  const columns = useMemo(() => {
    if (columnCount <= 0) return [];
    const cols: typeof filteredCards[][] = Array.from({ length: columnCount }, () => []);
    filteredCards.forEach((card, index) => {
      cols[index % columnCount].push(card);
    });
    return cols;
  }, [filteredCards, columnCount]);

  return (
    <div className="p-4 flex gap-4 h-full">
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
          {col.map((card) => (
            <div key={card.path} style={{ contentVisibility: "auto" }}>
              <CardItem data={card} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
