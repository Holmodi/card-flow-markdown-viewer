# 🗂️ Card-Flow

面向大规模 Markdown 碎片笔记的高性能卡片式预览工具。

---

## 📖 开发背景

在 AI 协作和碎片化知识爆发的时代，用户往往需要管理成千上万个 Markdown 格式的短笔记（卡片笔记）。然而，现有的主流工具（如 Obsidian）在处理大批量文件时存在以下痛点：

- **浏览效率瓶颈**：传统的"文件树 + 单文档编辑器"模式更适合深度创作，但在快速扫描、检索大量散落在不同文件夹下的碎片灵感时，操作路径过长且视觉密度不足。
- **管理负担过重**：为了查看内容，用户往往需要被迫进入完整的编辑环境，无法在不改变笔记库结构的前提下进行极速"预览"。

Card-Flow 的设计初衷是作为一个高性能的独立客户端，直接连接至现有的笔记库（如 Obsidian 库），在不破坏原有笔记文件结构的前提下，提供一种全新的、类似"灵感墙"的横向浏览体验。

---

## ✨ 核心特性

### 1. 无损接入 Obsidian 库
- **零侵入性**：直接读取指定的 Markdown 文件夹，不创建私有数据库或修改笔记元数据，确保笔记在 Obsidian 等软件中的完全兼容性。
- **结构透明**：支持读取 YAML Frontmatter，利用现有的 `tags`、`created`、`updated` 字段进行展示与排序。

### 2. 高效卡片流交互
- **瀑布流布局 (Masonry Layout)**：采用等宽不等高的虚拟化卡片布局，最大化屏幕利用率，支持 5000+ 卡片流畅滚动。
- **快速内容预览**：自动提取正文前 200 字符作为摘要，减少不必要的点击操作。
- **侧边详情面板**：点击卡片展开全文 Markdown 渲染，支持切换编辑模式直接修改文件。

### 3. AI 时代的高性能架构
- **原生 Rust 后端**：基于 Tauri 2 框架，利用 Rust 的高性能文件 IO，秒级完成数千个 Markdown 文件的解析与索引。
- **流式批量推送**：扫描结果按 200 张一批通过事件流推送至前端，UI 逐批渲染，不阻塞交互。
- **实时文件监听**：基于 `notify` crate 监听目录变更，外部新增、修改、删除 `.md` 文件后 UI 自动更新。
- **极低资源占用**：相比 Electron 应用，内存占用更小、启动更快，适合作为常驻工具使用。

### 4. 智能排序与过滤
- **时间轴同步**：优先读取 YAML Frontmatter 中的 `created`/`updated` 字段，无 frontmatter 时自动 fallback 到文件系统时间戳，确保排序始终有效。
- **多维排序**：支持按标题、创建时间、更新时间、文件大小排序，升降序切换。
- **标签筛选**：自动聚合所有卡片的标签，支持多标签 AND 逻辑过滤。
- **实时搜索**：客户端内存过滤，匹配标题与正文摘要，零延迟响应。

---

## 🏗️ 技术架构

```
card-flow/
├── src/                        # React 前端 (TypeScript)
│   ├── components/
│   │   ├── Toolbar.tsx         # 搜索栏、文件夹选择、排序控件
│   │   ├── CardGrid.tsx        # Masonic 虚拟瀑布流
│   │   ├── CardItem.tsx        # 单张卡片
│   │   ├── CardDetail.tsx      # 全文预览/编辑侧边面板
│   │   ├── TagFilter.tsx       # 标签筛选
│   │   └── EmptyState.tsx
│   ├── stores/cardStore.ts     # Zustand 状态管理 (Map<path, CardMeta>)
│   ├── hooks/
│   │   ├── useTauriEvents.ts   # 监听 scan-batch / scan-complete / fs-event
│   │   └── useCardFilter.ts    # useMemo 派生过滤排序列表
│   └── lib/tauri.ts            # invoke() 类型封装
└── src-tauri/src/              # Rust 后端
    ├── scanner.rs              # ignore crate 目录扫描，批量 emit 事件
    ├── frontmatter.rs          # serde_yaml YAML 解析 + 文件系统时间 fallback
    ├── watcher.rs              # notify crate 实时文件监听
    └── commands.rs             # Tauri commands: scan/read/write/create/delete
```

**通信模型：**
- **Commands (invoke)**：读文件、写文件、创建/删除卡片
- **Events (emit/listen)**：`scan-batch` 批量推送、`scan-complete` 扫描完成、`fs-event` 文件变更

**核心依赖：**

| 层 | 依赖 | 用途 |
|---|---|---|
| Rust | `tauri 2` | 应用框架 |
| Rust | `ignore 0.4` | 目录遍历（尊重 .gitignore） |
| Rust | `notify 7` | 文件系统监听 |
| Rust | `serde_yaml 0.9` | YAML Frontmatter 解析 |
| Rust | `tokio 1` | 异步运行时 |
| React | `masonic 4` | 虚拟化瀑布流布局 |
| React | `zustand 5` | 轻量状态管理 |
| React | `react-markdown 9` | Markdown 渲染 |
| React | `tailwindcss 4` | 样式 |

---

## ⚙️ 环境要求与安装

**开发环境**
- Rust 1.70+
- Node.js 18+
- macOS / Windows 10+ / Linux

**快速启动**

```bash
# 安装前端依赖
npm install

# 进入开发模式（热重载）
npm run tauri dev

# 构建安装包
npm run tauri build
```

---

## 🗺️ 未来规划 (Roadmap)

- [ ] 多库切换：支持在多个笔记库之间快速切换
- [ ] 增强搜索：集成全文索引，支持更精确的内容检索
- [ ] 语义关联：基于向量搜索实现卡片关联推荐
- [ ] 只读/编辑切换：在极速浏览模式与轻量编辑模式间无缝切换
- [ ] 自定义卡片宽度：适配不同屏幕尺寸和使用习惯
