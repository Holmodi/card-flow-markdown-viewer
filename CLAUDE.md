# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Install dependencies
npm install

# Development (hot reload)
npm run tauri dev

# Build frontend only
npm run build

# Build macOS app
npm run tauri build

# Check Rust compilation
cd src-tauri && cargo check
```

## Architecture Overview

Card-Flow is a Tauri 2 desktop app for browsing Markdown card notes. It uses a React frontend with Rust backend.

### Frontend (React + TypeScript)
- **State**: Zustand store (`src/stores/cardStore.ts`) - `Map<path, CardMeta>` for cards
- **Components**: Toolbar, CardGrid (react-masonry-css), CardItem, CardDetail (right sidebar)
- **Hooks**: `useCardFilter` (useMemo-based filtering/sorting), `useTauriEvents` (event listeners)

### Card Layout Evolution

#### v1: Manual Column Distribution (已废弃)
- 使用 `useWindowSize` 监听窗口大小
- 手动计算列数：`columnCount = windowWidth / (cardWidth + gap)`
- 使用 `useMemo` 将卡片按 index 分配到各列
- 问题：列内卡片等间距，无法实现紧密瀑布流

#### v2: react-masonry-css (当前)
- 使用 `react-masonry-css` 库实现真正的瀑布流
- 响应式断点配置：
  ```ts
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };
  ```
- 优势：短卡片自动向上填充，卡片紧密排列

### Backend (Rust)
- **scanner.rs**: Async directory scanning using `ignore` crate, emits `scan-batch` events
- **frontmatter.rs**: YAML frontmatter parsing with filesystem time fallback
- **watcher.rs**: File system watching via `notify` crate, emits `fs-event` events
- **commands.rs**: Tauri commands (scan/read/write/create/delete)

### Communication
- **Commands** (`invoke`): One-way calls returning results
- **Events** (`emit/listen`): Streaming data for large operations

```
scan_directory → scan-batch events → addCards() → CardGrid
                        ↓
                  scan-complete → setIsScanning(false)

File changes → fs-event → add/update/remove card
```

### UI Layer Management

#### Dropdown/Panel Rendering Strategy
**重要**: 下拉菜单和面板必须渲染在 CardGrid 外部，避免层叠上下文问题。

- **问题**: `react-masonry-css` 会创建层叠上下文，导致内部渲染的 fixed 定位元素被卡片覆盖
- **解决**: 将下拉菜单/面板移到 App.tsx 中作为全局组件渲染（如 SettingsPanel、RecentFoldersPanel）
- **示例**:
  ```tsx
  // App.tsx - 全局渲染
  {showRecentFolders && (
    <RecentFoldersPanel
      onClose={() => setShowRecentFolders(false)}
      onSelectFolder={handleOpenRecentFolder}
    />
  )}
  ```

#### Component Props Pattern
 Toolbar 接收控制下拉菜单的 props：
```tsx
<Toolbar
  onRecentFolderToggle={() => setShowRecentFolders(!showRecentFolders)}
  isRecentFolderOpen={showRecentFolders}
/>
```

## Critical Rules

### React Hooks Order
**Hooks MUST be called at the top level, before any conditional returns.** Violating this causes cards to not display.

```tsx
// WRONG
function CardGrid() {
  if (!currentDir) return <EmptyState />;
  const cards = useCardStore(s => s.cards); // ERROR!
}

// CORRECT
function CardGrid() {
  const cards = useCardStore(s => s.cards);
  const currentDir = useCardStore(s => s.currentDir);
  if (!currentDir) return <EmptyState />;
}
```

## Debugging

- **Rust**: `eprintln!("[debug] message");` - outputs to terminal
- **Frontend**: `console.log()`
- **Tauri DevTools**: macOS `Option + Command + I`

## Before Commit

1. Run `npm run build` to fix TypeScript errors
2. Remove unused imports
3. Verify hooks are at top level

## Release Workflow

### Full Release Process

```bash
# 1. 开发调试
npm run tauri dev

# 2. 构建并打包
npm run tauri build

# 3. 提交代码
git add -A
git commit -m "feat: description"

# 4. 推送到远程
git push origin main

# 5. 如果是更新版本，先删除旧 tag 和 release
gh release delete v0.1.0 -y
rm -rf src-tauri/target/release/bundle

# 6. 重新打包
npm run tauri build

# 7. 创建 release 并上传 DMG
gh release create v0.1.0 \
  --title "v0.1.0" \
  --notes "## Changes..." \
  -- /path/to/Card-Flow-Markdown-Viewer_0.1.0_aarch64.dmg
```

### GitHub Release Commands

```bash
# 查看所有 release
gh release list

# 下载 release 资产
gh release download v0.1.0 --dir ./downloads

# 删除旧 release（重新发布时需要）
gh release delete v0.1.0 -y
```

### macOS Bundle Location

打包产物位于：
- `.app`: `src-tauri/target/release/bundle/macos/Card-Flow-Markdown-Viewer.app`
- `.dmg`: `src-tauri/target/release/bundle/dmg/Card-Flow-Markdown-Viewer_0.1.0_aarch64.dmg`

### Troubleshooting

- **Release exists error**: 先删除旧 release 再创建新版本
- **Upload fails**: 确保在项目根目录运行命令，使用绝对路径指定 DMG 文件
- **Bundle cleanup**: 重新打包前删除 `src-tauri/target/release/bundle` 目录
