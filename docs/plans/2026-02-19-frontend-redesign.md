# 前端美化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 为 Card-Flow 实现现代简洁风格的美化，采用蓝紫色系、增加圆润感与微动画

**架构:** 基于 Tailwind CSS 进行主题定制，通过 CSS 变量和 utility classes 实现一致的视觉风格

**技术栈:** React 19, Tailwind CSS 4, TypeScript

---

## 任务概览

| 任务 | 文件 | 描述 |
|------|------|------|
| T1 | `src/index.css` | 更新全局 CSS 主题色和动画 |
| T2 | `src/components/CardItem.tsx` | 卡片样式美化 + hover 动画 |
| T3 | `src/components/Toolbar.tsx` | 工具栏样式统一 |
| T4 | `src/components/TagFilter.tsx` | 标签样式优化 |
| T5 | `src/components/CardDetail.tsx` | 详情面板美化 |
| T6 | `src/components/EmptyState.tsx` | 空状态优化 |
| T7 | `src/components/CardGrid.tsx` | 卡片加载动画 |

---

## 详细任务

### 任务 1: 更新全局 CSS 主题色和动画

**文件:**
- Modify: `src/index.css:1-14`

**步骤 1: 编辑文件**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary-50: #f5f3ff;
  --color-primary-100: #ede9fe;
  --color-primary-200: #ddd6fe;
  --color-primary-300: #c4b5fd;
  --color-primary-400: #a78bfa;
  --color-primary-500: #8b5cf6;
  --color-primary-600: #7c3aed;
  --color-primary-700: #6d28d9;
  --color-primary-800: #5b21b6;
  --color-primary-900: #4c1d95;
  --color-primary-950: #2e1065;

  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-slide-in-right: slide-in-right 0.3s ease-out;

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #020617; /* slate-950 */
  color: #e2e8f0;
}

#root {
  min-height: 100vh;
}

/* 卡片加载动画 */
.card-enter {
  animation: fade-in 0.4s ease-out forwards;
  opacity: 0;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0f172a;
}

::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
```

**步骤 2: 验证修改**
- 检查 Tailwind 主题变量是否正确配置

---

### 任务 2: 卡片样式美化 + hover 动画

**文件:**
- Modify: `src/components/CardItem.tsx:19-69`

**步骤 1: 编辑 CardItem 组件**

```tsx
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
```

**步骤 2: 验证修改**
- 检查卡片样式是否符合设计

---

### 任务 3: 工具栏样式统一

**文件:**
- Modify: `src/components/Toolbar.tsx:72-121`

**步骤 1: 编辑 Toolbar 组件**

```tsx
<div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
  <button
    onClick={handleOpenFolder}
    disabled={isScanning}
    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50
      text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-600/20
      transition-all duration-200 cursor-pointer"
  >
    {isScanning ? (
      <span className="flex items-center gap-2">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        扫描中...
      </span>
    ) : (
      "打开文件夹"
    )}
  </button>

  <div className="relative flex-1 max-w-md">
    <input
      type="text"
      placeholder="搜索卡片..."
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      className="w-full px-4 py-2 pl-10 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200
        placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20
        transition-all duration-200"
    />
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value as SortBy)}
    className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200
      focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20
      transition-all duration-200 cursor-pointer"
  >
    <option value="title">标题</option>
    <option value="created">创建时间</option>
    <option value="updated">更新时间</option>
    <option value="size">大小</option>
  </select>

  <button
    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
    className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-300
      hover:bg-slate-700 hover:text-white hover:border-slate-600
      transition-all duration-200 cursor-pointer"
  >
    {sortOrder === "asc" ? "↑" : "↓"}
  </button>

  <span className="text-xs text-slate-500 shrink-0 px-2">{cards.size} 张卡片</span>

  <div className="relative" ref={settingsRef}>
    <button
      onClick={() => setShowSettings(!showSettings)}
      className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-300
        hover:bg-slate-700 hover:text-white hover:border-slate-600
        transition-all duration-200 cursor-pointer"
      title="显示设置"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    {showSettings && <SettingsPanel />}
  </div>
</div>
```

**步骤 2: 验证修改**
- 检查工具栏按钮、输入框、选择框样式是否统一

---

### 任务 4: 标签过滤样式优化

**文件:**
- Modify: `src/components/TagFilter.tsx`

**步骤 1: 读取 TagFilter 组件**

```bash
cat /Users/xiaodixu/Documents/personal/claude/card-flow/src/components/TagFilter.tsx
```

**步骤 2: 编辑 TagFilter 组件**

```tsx
import { useCardStore } from "../stores/cardStore";
import type { CardMeta } from "../types/card";

export default function TagFilter() {
  const cards = useCardStore((s) => s.cards);
  const selectedTags = useCardStore((s) => s.selectedTags);
  const toggleTag = useCardStore((s) => s.toggleTag);

  const allTags = Array.from(
    new Set(cards.values().flatMap((c: CardMeta) => c.tags))
  ).sort();

  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 bg-slate-900/30 border-b border-slate-800/50">
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer
              ${isSelected
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50"
              }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
```

**步骤 3: 验证修改**
- 检查标签样式是否符合设计

---

### 任务 5: 详情面板美化

**文件:**
- Modify: `src/components/CardDetail.tsx:46-92`

**步骤 1: 编辑 CardDetail 组件**

```tsx
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
```

**步骤 2: 验证修改**
- 检查面板样式是否符合设计

---

### 任务 6: 空状态优化

**文件:**
- Modify: `src/components/EmptyState.tsx`

**步骤 1: 读取 EmptyState 组件**

```bash
cat /Users/xiaodixu/Documents/personal/claude/card-flow/src/components/EmptyState.tsx
```

**步骤 2: 编辑 EmptyState 组件**

```tsx
interface Props {
  message: string;
}

export default function EmptyState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-slate-400 text-lg font-medium">{message}</p>
      <p className="text-slate-600 text-sm mt-2">开始创建你的第一张卡片吧</p>
    </div>
  );
}
```

**步骤 3: 验证修改**
- 检查空状态样式是否符合设计

---

### 任务 7: 卡片加载动画

**文件:**
- Modify: `src/components/CardGrid.tsx:53-65`

**步骤 1: 编辑 CardGrid 组件**

```tsx
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
```

**步骤 2: 验证修改**
- 检查卡片加载动画效果

---

## 验证步骤

完成所有任务后，执行以下验证：

1. **启动开发服务器**
   ```bash
   cd /Users/xiaodixu/Documents/personal/claude/card-flow && npm run dev
   ```

2. **检查项目能否正常编译**
   - 确认无 TypeScript 错误
   - 确认无 Tailwind 配置错误

3. **手动测试**
   - 打开文件夹，检查卡片显示
   - hover 卡片，验证动画效果
   - 点击卡片打开详情面板
   - 测试标签过滤功能

---

**计划完成，已保存至 `docs/plans/2026-02-19-frontend-redesign.md`**

**执行选项:**

**1. Subagent-Driven (本会话)** - 我逐个任务调度子代理，任务间审查代码

**2. Parallel Session (单独会话)** - 在新会话中执行，批量执行带检查点

选择哪种方式？
