import { useMemo, useState } from "react";
import { useCardStore } from "../stores/cardStore";

const MAX_VISIBLE_TAGS = 8;
const MIN_COUNT_THRESHOLD = 2;

export default function TagFilter() {
  const cards = useCardStore((s) => s.cards);
  const selectedTags = useCardStore((s) => s.selectedTags);
  const toggleTag = useCardStore((s) => s.toggleTag);
  const [expanded, setExpanded] = useState(false);

  const { visibleTags, allExtraTags } = useMemo(() => {
    const tagCount = new Map<string, number>();
    for (const card of cards.values()) {
      for (const tag of card.tags) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
    }

    // 按数量降序排序
    const sorted = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1]);

    // 过滤：默认只显示数量 >= MIN_COUNT_THRESHOLD 的 tag
    const filtered = sorted.filter(([, count]) => count >= MIN_COUNT_THRESHOLD);

    // 默认显示前 MAX_VISIBLE_TAGS 个
    const visible = filtered.slice(0, MAX_VISIBLE_TAGS);

    // 额外标签：展开后显示所有（包含数量为 1 的）
    const extra = sorted.slice(MAX_VISIBLE_TAGS);

    return { visibleTags: visible, allExtraTags: extra };
  }, [cards]);

  if (visibleTags.length === 0 && allExtraTags.length === 0) return null;

  const displayTags = expanded ? [...visibleTags, ...allExtraTags] : visibleTags;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-slate-900/30 border-b border-slate-800/50">
      {/* 所有标签 */}
      {displayTags.map(([tag, count]) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer
            ${selectedTags.includes(tag)
              ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
              : "bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50"
            }`}
        >
          {tag} ({count})
        </button>
      ))}

      {/* 展开/收起按钮 */}
      {allExtraTags.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer
            bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50"
        >
          {expanded ? "收起" : `+${allExtraTags.length} 更多`}
        </button>
      )}
    </div>
  );
}
