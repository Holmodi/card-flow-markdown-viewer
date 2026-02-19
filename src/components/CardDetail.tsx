import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useCardStore } from "../stores/cardStore";
import { readFile, writeFile, deleteFile } from "../lib/tauri";

export default function CardDetail() {
  const selectedCard = useCardStore((s) => s.selectedCard);
  const cards = useCardStore((s) => s.cards);
  const setSelectedCard = useCardStore((s) => s.setSelectedCard);
  const removeCard = useCardStore((s) => s.removeCard);

  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  const card = selectedCard ? cards.get(selectedCard) : null;
  const isOpen = !!selectedCard && !!card;

  useEffect(() => {
    if (!selectedCard) return;
    setLoading(true);
    setEditing(false);
    readFile(selectedCard)
      .then((text) => {
        setContent(text);
        setEditContent(text);
      })
      .finally(() => setLoading(false));
  }, [selectedCard]);

  const handleSave = useCallback(async () => {
    if (!selectedCard) return;
    await writeFile(selectedCard, editContent);
    setContent(editContent);
    setEditing(false);
  }, [selectedCard, editContent]);

  const handleDelete = useCallback(async () => {
    if (!selectedCard || !confirm("确定删除这张卡片？")) return;
    await deleteFile(selectedCard);
    removeCard(selectedCard);
    setSelectedCard(null);
  }, [selectedCard, removeCard, setSelectedCard]);

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50
        flex flex-col overflow-hidden shadow-2xl z-50
        transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      style={{ width: "min(45%, 700px)" }}
    >
      {isOpen && (
        <>
          {/* Header - 玻璃态效果 */}
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
                    onClick={() => { setEditing(false); setEditContent(content); }}
                    className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-primary-600/20 transition-all cursor-pointer"
                >
                  编辑
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                删除
              </button>
              <button
                onClick={() => setSelectedCard(null)}
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
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
