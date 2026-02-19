import { memo, useCallback } from "react";
import type { CardMeta } from "../types/card";
import { useCardStore } from "../stores/cardStore";
import TimeDisplay from "./TimeDisplay";

interface Props {
  data: CardMeta;
}

function CardItemInner({ data }: Props) {
  const setSelectedCard = useCardStore((s) => s.setSelectedCard);
  const setDeleteConfirmPath = useCardStore((s) => s.setDeleteConfirmPath);
  const selectedCard = useCardStore((s) => s.selectedCard);
  const settings = useCardStore((s) => s.settings);
  const currentDir = useCardStore((s) => s.currentDir);
  const isSelected = selectedCard === data.path;

  // 计算相对路径（只显示父目录）
  const getParentPath = () => {
    if (!currentDir) return "";
    const relative = data.path.replace(currentDir, "").replace(/^\//, "");
    // 获取父目录路径（去掉文件名）
    const parts = relative.split("/");
    if (parts.length <= 1) return ""; // 文件直接在根目录，不显示
    parts.pop(); // 去掉文件名
    return parts.join("/");
  };
  const parentPath = getParentPath();

  const handleClick = useCallback(() => {
    setSelectedCard(data.path);
  }, [data.path, setSelectedCard]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmPath(data.path);
  }, [data.path, setDeleteConfirmPath]);

  return (
    <div className="group relative" style={{ animationDelay: `${Math.random() * 0.15}s` }}>
      <button
        onClick={handleDeleteClick}
        className="absolute -top-2 -right-2 p-1.5 bg-primary-600/90 hover:bg-primary-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        onClick={handleClick}
        className={`card-enter bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 cursor-pointer
          hover:bg-slate-800/80 hover:border-primary-500/40
          hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]
          hover:-translate-y-1 transition-all duration-300 ease-out
          ${isSelected ? "border-primary-500/60 shadow-[0_0_15px_rgba(139,92,246,0.25)]" : ""}`}
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
              className="px-2.5 py-0.5 bg-slate-700/60 text-slate-300 rounded-md text-xs font-medium border border-slate-600/50"
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
        <TimeDisplay isoString={data.created} />
        {parentPath && (
          <span className="text-slate-500 truncate max-w-[120px]" title={parentPath}>
            {parentPath}
          </span>
        )}
      </div>
      </div>
    </div>
  );
}

export default memo(CardItemInner);
