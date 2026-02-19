import { memo, useCallback } from "react";
import type { CardMeta } from "../types/card";
import { useCardStore } from "../stores/cardStore";

interface Props {
  data: CardMeta;
}

function CardItemInner({ data }: Props) {
  const setSelectedCard = useCardStore((s) => s.setSelectedCard);
  const selectedCard = useCardStore((s) => s.selectedCard);
  const settings = useCardStore((s) => s.settings);
  const isSelected = selectedCard === data.path;

  const handleClick = useCallback(() => {
    setSelectedCard(data.path);
  }, [data.path, setSelectedCard]);

  return (
    <div
      onClick={handleClick}
      className={`card-enter bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 cursor-pointer
        hover:bg-slate-800 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10
        hover:-translate-y-1 transition-all duration-300 ease-out
        ${isSelected ? "border-primary-500 ring-2 ring-primary-500/20" : ""}`}
      style={{ animationDelay: `${Math.random() * 0.2}s` }}
    >
      <h3
        className="font-semibold text-slate-100 mb-3 leading-snug"
        style={{
          fontSize: `${settings.titleFontSize}px`,
          display: "-webkit-box",
          WebkitLineClamp: settings.titleLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {data.title}
      </h3>

      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-primary-900/40 text-primary-300 rounded-full text-xs font-medium border border-primary-700/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p
        className="text-slate-400 leading-relaxed"
        style={{
          fontSize: `${settings.bodyFontSize}px`,
          display: "-webkit-box",
          WebkitLineClamp: settings.previewLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {data.preview || "（空内容）"}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="truncate max-w-[60%]">{data.created ?? ""}</span>
        <span className="text-slate-500 font-mono">{(data.size / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}

export default memo(CardItemInner);
