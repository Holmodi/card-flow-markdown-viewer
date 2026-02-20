# Card-Flow 开发问题总结

## 问题描述

打开包含 markdown 文件的文件夹后，界面显示深色背景，没有任何卡片显示。

## 排查过程

### 1. 确认后端扫描正常
- Rust 端 `scanner.rs` 正确扫描目录，找到 3 个 .md 文件
- 日志输出：`[scanner] Scan complete. Total files: 3, Duration: 4ms`

### 2. 发现前端 React Hooks 错误
浏览器控制台报错：
```
React has detected a change in the order of Hooks called by CardGrid.
This will lead to bugs and errors if not fixed.
```

错误原因：CardGrid 组件在条件返回（early return）之前调用了 Hooks，违反了 React Hooks 规则。

### 3. 修复 TypeScript 编译错误
- CardGrid.tsx 中有多余的 import（useRef, useState, useEffect）
- 类型定义问题需要导入 CardMeta 类型

## 解决方案

### 1. 修复 CardGrid Hooks 顺序问题

**问题代码**（错误）：
```tsx
export default function CardGrid() {
  const filteredCards = useCardFilter();
  // ... 其他 hooks

  if (!currentDir) {  // early return
    return <EmptyState ... />;
  }
  // 后面又有条件返回
  if (filteredCards.length === 0 && !isScanning) {
    // ...
  }
}
```

**修复后**（正确）：
```tsx
export default function CardGrid() {
  // 所有 hooks 必须在条件返回之前调用
  const filteredCards = useCardFilter();
  const isScanning = useCardStore((s) => s.isScanning);
  const currentDir = useCardStore((s) => s.currentDir);
  // ... 其他 hooks

  // 计算派生状态
  const hasFilter = searchQuery.trim().length > 0 || selectedTags.length > 0;
  const hasCards = cards.size > 0;

  // useMemo 也必须在条件返回之前
  const columns = useMemo(() => { ... }, [filteredCards, columnCount]);

  // 条件返回必须在所有 hooks 之后
  if (!currentDir) {
    return <EmptyState ... />;
  }
  // ...
}
```

### 2. 修复 TypeScript 错误

```tsx
// 移除未使用的 imports
import { useMemo } from "react";
// import { useMemo, useRef, useState, useEffect } from "react"; // 错误

// 显式指定类型
const cols: CardMeta[][] = Array.from({ length: columnCount }, () => []);
```

## 后续开发注意事项

### React Hooks 规则
1. **只能在组件顶层调用 Hooks**，不能在循环、条件语句或嵌套函数中调用
2. **每次渲染时 Hooks 调用顺序必须一致**
3. 如果需要在条件渲染前计算派生数据，先用变量存储计算结果

### 调试技巧
1. **Rust 端调试**：使用 `eprintln!` 输出到终端
   ```rust
   macro_rules! log {
       ($($arg:tt)*) => {
           eprintln!("[scanner] {}", format!($($arg)*))
       };
   }
   ```

2. **前端调试**：使用 `console.log`

3. **Tauri 开发者工具**：
   - macOS: `Option + Command + I`
   - 菜单: View -> Developer -> Developer Tools

### TypeScript 编译检查
- 提交代码前运行 `npm run build` 确保没有编译错误
- 修复未使用的 imports 和类型错误

## 相关文件

- `src/components/CardGrid.tsx` - Hooks 顺序修复
- `src/hooks/useTauriEvents.ts` - 添加调试日志
- `src-tauri/src/scanner.rs` - 添加扫描日志

---

# GitHub Release 与打包工作流

## 快速发布命令

```bash
# 完整流程
git add -A && git commit -m "feat: description"
git push origin main
npm run tauri build
gh release create v0.1.0 --title "v0.1.0" --notes "## Changes..." -- /path/to/dmg
```

## 常见问题处理

### 1. 版本更新时删除旧 release
```bash
gh release delete v0.1.0 -y
rm -rf src-tauri/target/release/bundle
npm run tauri build
```

### 2. 打包产物位置
```
src-tauri/target/release/bundle/
├── macos/Card-Flow-Markdown-Viewer.app
└── dmg/Card-Flow-Markdown-Viewer_0.1.0_aarch64.dmg
```

### 3. GitHub CLI 验证登录状态
```bash
gh auth status
gh release list
```

## 发布检查清单

- [ ] `npm run build` TypeScript 编译通过
- [ ] 功能测试通过
- [ ] 更新版本号（如需要）
- [ ] 编写 release notes
- [ ] 上传 DMG 文件

---

# 2024-02-19: 卡片布局和关闭按钮修复

## 问题 1: 关闭按钮位置不一致

**现象**: 不同大小的卡片，按钮相对位置不同

**根因**: CardItem 使用 `pt-2 pr-2` padding 包裹卡片内容，按钮相对于外层容器定位，导致按钮位置随卡片高度变化

**解决**:
- 移除外层容器的 `pt-2 pr-2` padding
- 按钮改为 `-top-2 -right-2` 相对于卡片 div 定位
- 删除 `translate-x-1` 调整

**修改文件**: `src/components/CardItem.tsx`

---

## 问题 2: 卡片无法紧密排列

**现象**: CSS Columns 布局导致列内卡片等间距，无法实现瀑布流效果

**根因**:
- 之前使用手动列分配，每列独立渲染
- 短卡片无法向上填充到上方列的空位

**解决**:
- 安装 `react-masonry-css` 依赖
- 移除 `useWindowSize` 和手动列计算逻辑
- 使用 Masonry 组件的响应式断点配置

**修改文件**: `src/components/CardGrid.tsx`

---

## 问题 3: TypeScript 构建错误

**错误信息**:
```
error TS6133: 'useMemo' is declared but its value is never read.
error TS2786: 'Masonry' cannot be used as a JSX component.
```

**解决**:
1. 移除未使用的 `useMemo` import
2. 在正确目录 (`card-flow-markdown-viewer/`) 安装依赖

**注意**: 依赖安装到全局目录会导致模块找不到，必须在项目目录执行 `npm install`

---

## 验证步骤

1. `npm run build` - 确保 TypeScript 编译通过
2. 测试关闭按钮位置是否固定在每张卡片右上角
3. 测试卡片是否紧密排列，短卡片向上填充

---

# 2025-02-19: 文件锁问题与 Frontmatter 问题修复

## 问题 1: 其他软件无法写入已打开的 md 文件

**现象**: 打开文件夹后，其他编辑器无法保存 md 文件

**根因**: `ignore::WalkBuilder` 在遍历目录时保持文件句柄打开

**解决**:
- 将 `scanner.rs` 中的 `WalkBuilder` 改为 `std::fs::read_dir` 递归扫描
- 移除 `Cargo.toml` 中的 `ignore` 依赖
- 优化 `frontmatter.rs`，先获取元数据再读取内容

**修改文件**:
- `src-tauri/src/scanner.rs` - 使用 `fs::read_dir` 替代 `ignore::WalkBuilder`
- `src-tauri/src/frontmatter.rs` - 优化文件读取顺序
- `src-tauri/Cargo.toml` - 移除 `ignore` 依赖

---

## 问题 2: 新建卡片正文显示 YAML frontmatter

**现象**: 新建卡片后，正文区域显示 `---title: "xxx"tags: []---`

**根因**: `read_file` 命令返回文件原始内容，包含 frontmatter，`ReactMarkdown` 将其当作普通文本渲染

**解决**:
- 在 `frontmatter.rs` 添加 `get_body()` 函数提取正文
- 修改 `commands.rs` 的 `read_file` 跳过 frontmatter

**修改文件**:
- `src-tauri/src/frontmatter.rs` - 添加 `get_body()` 函数
- `src-tauri/src/commands.rs` - `read_file` 只返回正文内容

---

# 2025-02-19: 正文窗口拖动宽度调整

## 实现功能

- 左侧边缘拖动手柄调整正文窗口宽度
- 向左拖动放大，向右拖动缩小
- 悬停时显示紫色高亮边框
- 宽度设置持久化到 localStorage

## 关键实现

```tsx
// 拖动手柄定位
style={{
  left: `${window.innerWidth - detailWidth}px`,
  width: "12px",
  marginLeft: "-6px"
}}

// 拖动方向（向左放大，向右缩小）
const deltaX = e.clientX - resizeStartRef.current.startX;
const newWidth = resizeStartRef.current.startWidth - deltaX;
```

## 修改文件

- `src/types/settings.ts` - 添加 `detailWidth` 字段
- `src/stores/cardStore.ts` - 处理 `detailWidth` 持久化
- `src/components/CardDetail.tsx` - 拖动手柄与宽度调整逻辑

## TypeScript 类型问题

**错误**: `Masonry` 组件 `breakpointCols` 类型不兼容

**解决**: 使用类型断言
```tsx
breakpointCols={breakpointColumns as number | Record<number, number>}
```

---

# 开发注意事项

## React-masonry-css 使用

- `breakpointCols` 可以是数字（固定列数）或对象（响应式配置）
- 列间距通过外层容器的负 margin 和列的 padding 实现
- 不要在 Masonry 子元素上设置固定宽度，让内容自适应

## 拖动区域实现要点

- 手柄使用 `fixed` 定位，紧贴面板左边缘
- 通过 `isHovering` 和 `isResizing` state 控制高亮显示
- 拖动时使用 `document` 事件监听，确保鼠标移出区域也能继续拖动
- 保存设置时机的选择（拖动结束 vs 实时保存）

---

# 2026-02-20: 最近文件夹面板层叠问题修复

## 问题描述

1. 最近文件夹下拉菜单被卡片笔记的卡片覆盖
2. 打开后无法直接点击最近的目录打开对应的文件夹

## 根因分析

- `react-masonry-css` 库创建了特殊的层叠上下文
- 下拉菜单在 Toolbar 组件内部渲染，受到 CardGrid 层叠影响
- 即使使用 `fixed` 定位和 `z-[100]`，仍被卡片覆盖

## 解决方案

将最近文件夹下拉菜单移到 App.tsx 中渲染，作为全局组件：

1. **Toolbar.tsx 修改**:
   - 移除下拉菜单状态和逻辑
   - 导出 `RecentFolderButton` 组件供父组件使用
   - 接收 `onRecentFolderToggle` 和 `isRecentFolderOpen` props

2. **App.tsx 修改**:
   - 添加 `showRecentFolders` 状态
   - 创建 `RecentFoldersPanel` 组件（类似 SettingsPanel）
   - 使用 `fixed` 定位和 `z-[100]` 确保在最顶层
   - 添加 `onMouseDown={(e) => e.stopPropagation()}` 防止点击事件被阻止

## 修改文件

- `src/components/Toolbar.tsx` - 移除下拉菜单，提取按钮组件
- `src/App.tsx` - 添加 RecentFoldersPanel 全局组件

## 验证方式

1. 点击最近文件夹按钮
2. 确认下拉菜单显示在卡片之上
3. 点击任意最近文件夹，确认可以正常打开

---

# 组件设计模式

## 全局下拉面板

当组件需要显示在 CardGrid 之上时，应在 App.tsx 中渲染：

```tsx
// App.tsx
const [showPanel, setShowPanel] = useState(false);

return (
  <>
    <Toolbar onToggle={() => setShowPanel(!showPanel)} isOpen={showPanel} />
    {showPanel && <GlobalPanel onClose={() => setShowPanel(false)} />}
  </>
);
```

## 事件冒泡处理

在使用全局面板时，注意阻止事件冒泡：
```tsx
<div onMouseDown={(e) => e.stopPropagation()}>
  {/* panel content */}
</div>
```
