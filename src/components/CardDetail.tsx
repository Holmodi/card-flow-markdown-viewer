import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCardStore } from "../stores/cardStore";
import { readFile, writeFile } from "../lib/tauri";

export default function CardDetail() {
  const selectedCard = useCardStore((s) => s.selectedCard);
  const cards = useCardStore((s) => s.cards);
  const setSelectedCard = useCardStore((s) => s.setSelectedCard);
  const settings = useCardStore((s) => s.settings);
  const updateSettings = useCardStore((s) => s.updateSettings);
  const setIsEditing = useCardStore((s) => s.setIsEditing);
  const setWordCount = useCardStore((s) => s.setWordCount);

  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailWidth, setDetailWidth] = useState(settings.detailWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const card = selectedCard ? cards.get(selectedCard) : null;
  const isOpen = !!selectedCard && !!card;

  // 初始化宽度
  useEffect(() => {
    setDetailWidth(settings.detailWidth);
  }, [settings.detailWidth]);

  // 读取文件
  useEffect(() => {
    if (!selectedCard) return;
    setLoading(true);
    setEditing(false);
    setIsEditing(false);
    readFile(selectedCard)
      .then((text) => {
        setContent(text);
        setEditContent(text);
        // 计算字数
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = text.replace(/[\u4e00-\u9fa5]/g, "").trim().split(/\s+/).filter(Boolean).length;
        setWordCount(chineseChars + englishWords);
      })
      .finally(() => setLoading(false));
  }, [selectedCard, setIsEditing]);

  // 拖动处理
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.startX;
      // 向左拖动放大，向右拖动缩小
      const newWidth = resizeStartRef.current.startWidth - deltaX;

      if (newWidth >= 300 && newWidth <= 1000) {
        setDetailWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      updateSettings({ detailWidth });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, detailWidth, updateSettings]);

  const handleSave = useCallback(async () => {
    if (!selectedCard) return;
    await writeFile(selectedCard, editContent);
    setContent(editContent);
    setEditing(false);
    setIsEditing(false);
  }, [selectedCard, editContent, setIsEditing]);

  return (
    <div className="relative">
      {/* 拖动手柄 - 独立于面板 */}
      <div
        id="resize-handle"
        className="fixed top-0 h-full cursor-ew-resize z-[60]
          opacity-0 pointer-events-none
          flex items-center justify-center transition-opacity"
        style={{
          left: `${window.innerWidth - detailWidth}px`,
          width: "12px",
          marginLeft: "-6px",
          pointerEvents: isOpen ? "auto" : "none",
          opacity: isOpen ? 1 : 0,
          borderLeft: (isHovering || isResizing) ? "2px solid rgba(139, 92, 246, 0.8)" : "none"
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
          resizeStartRef.current = {
            startX: e.clientX,
            startWidth: detailWidth
          };
        }}
      >
        {/* 手柄竖线 */}
        <div className="w-0.5 h-8 bg-slate-500/60 rounded-full" />
      </div>

      {/* 主面板 */}
      <div
        ref={containerRef}
        className={`fixed top-0 h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50
          flex flex-col overflow-hidden shadow-2xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{
          width: detailWidth,
          right: 0
        }}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50
              bg-slate-800/30 backdrop-blur-md shrink-0">
              <h2 className="text-lg font-semibold text-slate-100 truncate">{card.title}</h2>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditContent(content); setIsEditing(false); }}
                      className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setEditing(true); setIsEditing(true); }}
                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-primary-600/20 transition-all cursor-pointer"
                  >
                    编辑
                  </button>
                )}
                <button
                  onClick={() => { setSelectedCard(null); setIsEditing(false); }}
                  className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    加载中...
                  </span>
                </div>
              ) : editing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[60vh] bg-slate-800/50 border border-slate-700 rounded-xl p-4
                    text-sm text-slate-200 font-mono focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20
                    transition-all duration-200 resize-none"
                />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline prose-code:text-primary-300 prose-code:bg-slate-800 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-pre:bg-slate-800/50 prose-pre:border prose-pre:border-slate-700/50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
