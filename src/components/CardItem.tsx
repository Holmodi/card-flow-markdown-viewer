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
      className={`bg-slate-800 border rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-slate-750 transition-colors ${
        isSelected ? "border-blue-500 ring-1 ring-blue-500/50" : "border-slate-700"
      }`}
    >
      <h3
        className="font-semibold text-slate-100 mb-2"
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
        <div className="flex flex-wrap gap-1 mb-2">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full text-xs"
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

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{data.created ?? ""}</span>
        <span>{(data.size / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}

export default memo(CardItemInner);
