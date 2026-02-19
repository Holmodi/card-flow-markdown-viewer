import { useMemo } from "react";
import { useCardFilter } from "../hooks/useCardFilter";
import CardItem from "./CardItem";
import EmptyState from "./EmptyState";
import { useCardStore } from "../stores/cardStore";
import { useWindowSize } from "./useWindowSize";
import type { CardMeta } from "../types/card";

export default function CardGrid() {
  const filteredCards = useCardFilter();
  const isScanning = useCardStore((s) => s.isScanning);
  const currentDir = useCardStore((s) => s.currentDir);
  const selectedTags = useCardStore((s) => s.selectedTags);
  const searchQuery = useCardStore((s) => s.searchQuery);
  const cards = useCardStore((s) => s.cards);
  const cardWidth = useCardStore((s) => s.settings.cardWidth);
  const windowSize = useWindowSize();

  // 所有 hook 调用必须在这里完成，不能在条件返回之后
  const hasFilter = searchQuery.trim().length > 0 || selectedTags.length > 0;
  const hasCards = cards.size > 0;

  // 计算列数（每列宽度 = cardWidth + gap）
  const gap = 16;
  const columnWidth = cardWidth + gap;
  const columnCount = Math.max(1, Math.floor(windowSize.width / columnWidth));

  // 将卡片分配到各列
  const columns = useMemo(() => {
    if (columnCount <= 0) return [] as CardMeta[][];
    const cols: CardMeta[][] = Array.from({ length: columnCount }, () => []);
    filteredCards.forEach((card, index) => {
      cols[index % columnCount].push(card);
    });
    return cols;
  }, [filteredCards, columnCount]);

  // 条件渲染必须在 hooks 之后
  if (!currentDir) {
    return <EmptyState message="点击「打开文件夹」选择一个包含 .md 文件的目录" />;
  }

  if (filteredCards.length === 0 && !isScanning) {
    if (hasFilter) {
      return <EmptyState message="没有找到匹配的卡片" />;
    }
    if (!hasCards) {
      return <EmptyState message="该目录下没有 .md 文件" />;
    }
  }

  return (
    <div className="p-4 flex gap-4 h-full">
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
          {col.map((card, cardIndex) => (
            <div
              key={card.path}
              style={{
                contentVisibility: "auto",
                animationDelay: `${cardIndex * 0.05}s`
              }}
            >
              <CardItem data={card} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
