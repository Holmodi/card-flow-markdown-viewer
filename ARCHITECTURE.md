# Card-Flow 架构文档

## 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 前端框架 | React | 19 |
| 状态管理 | Zustand | 5 |
| 样式 | Tailwind CSS | 4 |
| Markdown 渲染 | react-markdown | 9 |
| 构建工具 | Vite | 6 |
| 桌面运行时 | Tauri | 2 |
| 后端语言 | Rust | - |
| 类型系统 | TypeScript | 5.7 |

## 目录结构

```
card-flow/
├── src/                          # React 前端
│   ├── main.tsx                  # 入口，挂载 <App />
│   ├── App.tsx                   # 根组件：布局 + 新建卡片
│   ├── index.css                 # 全局样式 / Tailwind 入口
│   ├── components/
│   │   ├── Toolbar.tsx           # 顶栏：打开文件夹、搜索、排序
│   │   ├── TagFilter.tsx         # 标签过滤栏
│   │   ├── CardGrid.tsx          # 瀑布流卡片网格
│   │   ├── CardItem.tsx          # 单张卡片
│   │   ├── CardDetail.tsx        # 卡片详情面板（Markdown 预览/编辑）
│   │   ├── EmptyState.tsx        # 空状态占位
│   │   └── useWindowSize.ts      # 窗口尺寸 hook
│   ├── hooks/
│   │   ├── useCardFilter.ts      # 过滤 + 排序 (useMemo)
│   │   └── useTauriEvents.ts     # 监听 Tauri 事件
│   ├── lib/
│   │   └── tauri.ts              # invoke() 类型封装
│   ├── stores/
│   │   └── cardStore.ts          # Zustand 全局状态
│   └── types/
│       └── card.ts               # 共享类型定义
├── src-tauri/src/                # Rust 后端
│   ├── main.rs                   # Tauri 入口
│   ├── lib.rs                    # 模块注册
│   ├── commands.rs               # Tauri 命令处理
│   ├── scanner.rs                # 目录扫描
│   ├── frontmatter.rs            # YAML frontmatter 解析
│   ├── watcher.rs                # 文件系统监听
│   └── models.rs                 # Rust 数据模型
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 组件层级

```
<App>
├── <Toolbar />            # 文件夹选择、搜索、排序控制
├── <TagFilter />          # 标签过滤按钮组
├── 新建卡片 UI (条件渲染)
├── <CardGrid>             # 瀑布流网格容器
│   └── <CardItem /> × N   # 单张卡片（标题、标签、预览、元信息）
└── <CardDetail />         # 右侧详情面板（Markdown 渲染 / 编辑器）
```

## 数据流

```
用户操作                    Zustand Store              组件响应
─────────                  ─────────────              ────────
打开文件夹 ──→ setCurrentDir, clearCards ──→ Toolbar 禁用
             ──→ scanDirectory(path)       ──→ Rust 扫描
Rust 扫描完成 ──→ scan-batch 事件 ──→ addCards() ──→ CardGrid 重渲染
             ──→ scan-complete 事件 ──→ setIsScanning(false)
搜索输入     ──→ setSearchQuery()   ──→ useCardFilter 重算 ──→ CardGrid
标签点击     ──→ toggleTag()        ──→ useCardFilter 重算 ──→ CardGrid
卡片点击     ──→ setSelectedCard()  ──→ CardDetail 展开
文件变更     ──→ fs-event 事件      ──→ add/update/removeCard()
```

## Store 状态 (cardStore)

```typescript
interface CardStore {
  // 数据
  cards: Map<string, CardMeta>   // 所有卡片，以文件路径为 key
  currentDir: string | null       // 当前扫描目录

  // UI 状态
  searchQuery: string             // 搜索关键词
  selectedTags: string[]          // 已选标签（AND 逻辑）
  sortBy: SortBy                  // 排序字段
  sortOrder: SortOrder            // 排序方向
  selectedCard: string | null     // 当前选中卡片路径
  isScanning: boolean             // 是否正在扫描

  // Actions
  addCards / updateCard / removeCard
  setSearchQuery / setSelectedTags / toggleTag
  setSortBy / setSortOrder
  setSelectedCard / setIsScanning / setCurrentDir / clearCards
}
```

## Tauri 命令

| 命令 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `scan_directory` | `path` | `void` | 异步扫描，通过事件批量返回 |
| `read_file` | `path` | `string` | 读取文件全文 |
| `write_file` | `path, content` | `CardMeta` | 写入并返回更新元数据 |
| `create_file` | `directory, filename` | `CardMeta` | 创建新 .md 文件 |
| `delete_file` | `path` | `void` | 删除文件 |

## Tauri 事件

| 事件 | Payload | 触发时机 |
|------|---------|----------|
| `scan-batch` | `{ cards, scanned_so_far }` | 扫描中批量推送 |
| `scan-complete` | `{ total_files, duration_ms }` | 扫描完成 |
| `fs-event` | `{ kind, path, card }` | 文件变更 |

## 类型定义

```typescript
interface CardMeta {
  path: string; title: string; tags: string[]
  created: string | null; updated: string | null
  preview: string; size: number
}
type SortBy = "title" | "created" | "updated" | "size"
type SortOrder = "asc" | "desc"
```
