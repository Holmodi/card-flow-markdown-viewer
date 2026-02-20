# MarkDance

A high-performance card-style preview tool for large-scale Markdown fragment notes.

![Main Interface](pic/cardflowPreView.png)

---

[中文版](./README_ZH.md)

---

## Core Features

- **Lossless Obsidian Integration**: Directly read specified folders, zero intrusion
- **Masonry Layout**: Efficiently browse 5000+ cards with responsive arrangement
- **Sidebar Detail Panel**: Markdown rendering and editing
- **Smart Filter & Sort**: Tag filtering, timeline sorting, real-time search
- **Real-time File Monitoring**: Auto-update on directory changes
![Main Interface 2](pic/carflowPreView2.png)
---

## Quick Start

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run tauri dev

# Build installer
npm run tauri build
```

---

## Tech Stack

| Layer | Dependency | Purpose |
|---|---|---|
| Frontend Framework | React 19 | UI |
| State Management | Zustand 5 | Global state |
| Markdown | react-markdown 9 + remark-gfm 4 | Rendering |
| Styling | Tailwind CSS 4 | Styles |
| Masonry | react-masonry-css | Card layout |
| Build | Vite 6 | Build tool |
| Desktop | Tauri 2 | Desktop app framework |
| Backend | Rust | File IO |

---

## Project Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── index.css             # Global styles
├── components/
│   ├── Toolbar.tsx       # Top bar
│   ├── TagFilter.tsx     # Tag filtering
│   ├── CardGrid.tsx      # Masonry grid
│   ├── CardItem.tsx      # Single card
│   ├── CardDetail.tsx    # Detail panel
│   ├── SettingsPanel.tsx # Settings panel
│   ├── FloatingTool.tsx  # Floating tool
│   ├── TimeDisplay.tsx   # Time display
│   └── EmptyState.tsx    # Empty state
├── hooks/
│   ├── useTauriEvents.ts # Event listening
│   └── useCardFilter.ts  # Filter & sort
├── lib/
│   ├── tauri.ts          # Tauri invocation
│   └── timezone.ts       # Timezone utilities
├── stores/
│   └── cardStore.ts      # Zustand store
└── types/
    ├── card.ts           # Card types
    └── settings.ts        # Settings types
```
