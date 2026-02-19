import { useMemo } from "react";
import Masonry from "react-masonry-css";
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
  const settings = useCardStore((s) => s.settings);
  const { width: windowWidth } = useWindowSize();

  // 所有 hook 调用必须在这里完成，不能在条件返回之后
  const hasFilter = searchQuery.trim().length > 0 || selectedTags.length > 0;
  const hasCards = cards.size > 0;

  // 根据用户设置的列数和小屏幕自动调整
  const breakpointColumns = useMemo(() => {
    const cols = settings.columnCount;

    // 在小屏幕上自动减少列数
    if (windowWidth < 600) {
      return { default: 1 };
    } else if (windowWidth < 900 && cols > 2) {
      return { default: 2 };
    } else if (windowWidth < 1200 && cols > 3) {
      return { default: 3 };
    } else if (windowWidth < 1600 && cols > 4) {
      return { default: 4 };
    }

    // 根据用户设置返回固定列数
    return cols;
  }, [settings.columnCount, windowWidth]);

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
    <Masonry
      breakpointCols={breakpointColumns as number | Record<number, number>}
      className="flex -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {filteredCards.map((card, index) => (
        <div
          key={card.path}
          style={{
            marginBottom: 16,
            animationDelay: `${index * 0.05}s`
          }}
        >
          <CardItem data={card} />
        </div>
      ))}
    </Masonry>
  );
}
