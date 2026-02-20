# MarkDance

面向大规模 Markdown 碎片笔记的高性能卡片式预览工具。

![主界面](pic/cardflowPreView.png)

---

[English Version](./README.md)

---

## 核心特性

- **无损接入 Obsidian 库**：直接读取指定文件夹，零侵入性
- **瀑布流布局**：高效浏览 5000+ 卡片，响应式排列
- **侧边详情面板**：Markdown 渲染与编辑
- **智能过滤排序**：标签筛选、时间轴排序、实时搜索
- **实时文件监听**：目录变更自动更新
![主界面2](pic/carflowPreView2.png)
---

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run tauri dev

# 构建安装包
npm run tauri build
```

---

## 技术栈

| 层 | 依赖 | 用途 |
|---|---|---|
| 前端框架 | React 19 | UI |
| 状态管理 | Zustand 5 | 全局状态 |
| Markdown | react-markdown 9 + remark-gfm 4 | 渲染 |
| 样式 | Tailwind CSS 4 | 样式 |
| 瀑布流 | react-masonry-css | 卡片布局 |
| 构建 | Vite 6 | 构建工具 |
| 桌面 | Tauri 2 | 桌面应用框架 |
| 后端 | Rust | 文件 IO |

---

## 目录结构

```
src/
├── main.tsx              # 入口
├── App.tsx               # 根组件
├── index.css             # 全局样式
├── components/
│   ├── Toolbar.tsx       # 顶栏
│   ├── TagFilter.tsx     # 标签过滤
│   ├── CardGrid.tsx      # 瀑布流网格
│   ├── CardItem.tsx      # 单张卡片
│   ├── CardDetail.tsx    # 详情面板
│   ├── SettingsPanel.tsx # 设置面板
│   ├── FloatingTool.tsx  # 悬浮工具
│   ├── TimeDisplay.tsx   # 时间显示
│   └── EmptyState.tsx    # 空状态
├── hooks/
│   ├── useTauriEvents.ts # 事件监听
│   └── useCardFilter.ts  # 过滤排序
├── lib/
│   ├── tauri.ts          # Tauri 调用
│   └── timezone.ts       # 时区工具
├── stores/
│   └── cardStore.ts      # Zustand 状态
└── types/
    ├── card.ts           # 卡片类型
    └── settings.ts        # 设置类型
```
