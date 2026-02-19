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
