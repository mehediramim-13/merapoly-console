# MeRa Poly — Polyglot Code Console

A modern, glassy, fully responsive code console built with **Next.js**.
Write and run **C, C++, Java, JavaScript and Python**, then download your code as a **file** or as a beautiful **image**.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Features

- 5 languages: C, C++, Java, JavaScript, Python — real run, real output
- Monaco editor (the VS Code engine): IntelliSense, bracket colors, multi-cursor, 5 themes
- Console with colored logs / warnings / errors, `console.table`, `console.group`, top-level `await`
- **Input (stdin)** panel for `scanf`, `cin`, `Scanner`, `input()`, `prompt()`
- Templates & snippets for every language
- **Download as file** (`main.c`, `main.cpp`, `Main.java`, `script.js`, `main.py`) — `Ctrl/⌘ + S`
- **Download as image** — full code on one page, 7 backgrounds, line numbers, window header, optional output, 1x/2x/3x quality, copy to clipboard
- Open files (button or drag & drop), copy / download console output
- Live mode for JavaScript (auto-run while you type)
- Settings: theme, font size, tab size, word wrap, minimap, ligatures, layout, time limit (saved locally)
- Mobile-first: bottom tab bar (Code / Output / Input), safe-area aware, touch friendly

## How code is executed

| Language | Where it runs |
| --- | --- |
| JavaScript | In your browser, inside a sandboxed Web Worker (`public/js-runner.worker.js`). Infinite loops are stopped by the time limit. |
| C, C++, Java, Python | `POST /api/run` (`src/app/api/run/route.js`) |

`/api/run` picks a runner automatically:

1. **Local** — if `gcc`, `g++`, `javac`/`java`, `python3` are installed on your computer. Fast and works offline. Enabled by default in `npm run dev`, **disabled in production** (running strangers' code on your server is dangerous).
2. **Cloud** — otherwise it uses the free public [Judge0 CE](https://ce.judge0.com) instance (needs internet; rate-limited).

> Tip: for the best experience install a compiler toolchain locally
> (Windows: [MSYS2/MinGW](https://www.msys2.org) + [JDK](https://adoptium.net) + [Python](https://python.org); macOS: `xcode-select --install`; Linux: `sudo apt install build-essential default-jdk python3`).

Configuration lives in `.env.example` — copy it to `.env.local` to change the runner or point to your own Judge0 server.

## Project structure

```
merapoly/
├─ public/
│  └─ js-runner.worker.js      # sandboxed JS runner (console capture, timers, prompt())
├─ src/
│  ├─ app/
│  │  ├─ api/run/route.js      # C / C++ / Java / Python execution (local + Judge0)
│  │  ├─ globals.css           # Tailwind v4 + design tokens + effects
│  │  ├─ icon.svg              # favicon
│  │  ├─ layout.jsx
│  │  └─ page.jsx
│  ├─ components/
│  │  ├─ Playground.jsx        # main screen: state, run logic, shortcuts
│  │  ├─ EditorPanel.jsx       # Monaco + toolbar
│  │  ├─ ConsolePanel.jsx      # output console
│  │  ├─ StdinPanel.jsx        # program input
│  │  ├─ LanguageTabs.jsx
│  │  ├─ SettingsDrawer.jsx
│  │  ├─ TemplatesModal.jsx
│  │  ├─ ExportModal.jsx       # "download as image" dialog
│  │  ├─ ExportCard.jsx        # the image itself (syntax highlighted)
│  │  └─ ui.jsx                # Logo, Toggle, Segmented, Modal, Toasts, Aurora
│  ├─ hooks/useStoredState.js  # localStorage-backed state
│  └─ lib/
│     ├─ languages.js          # languages, icons, templates, snippets
│     ├─ themes.js             # editor themes + default settings
│     ├─ runner.js             # client-side runners
│     ├─ highlight.js          # highlight.js → per-line HTML (image export)
│     └─ download.js           # download / clipboard helpers
├─ .env.example
├─ next.config.mjs
├─ postcss.config.mjs
└─ package.json
```

## Notes

- The Monaco editor is loaded from a CDN by `@monaco-editor/react`, so the first load needs internet.
- Java: the public class name decides the file name (`public class Main` → `Main.java`).
- Keyboard: `Ctrl/⌘ + Enter` run · `Ctrl/⌘ + S` download · `Ctrl/⌘ + ,` settings · `Esc` close panels.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on :3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
