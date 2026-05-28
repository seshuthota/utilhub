# AGENTS.md

UtilHub is a Next.js 16 App Router project with 42 client-side developer tools.

## Commands

```bash
npm install              # Install dependencies (Node >=22.22.0, see .nvmrc)
npm run dev              # next dev --webpack  (localhost:3000)
npm run build            # next build --webpack (MUST use --webpack flag)
npm run start            # next start
npm run lint             # ESLint (Next.js core-web-vitals)
npm test                 # Vitest (once)
npm test -- --coverage   # With coverage
npm test src/test/somefile.test.jsx   # Single test file
```

## Architecture

- **Framework**: Next.js 16 App Router + **Webpack** (`--webpack` is mandatory; no Turbopack)
- **Language**: TypeScript (`.tsx`/`.ts`), with `allowJs: true` for remaining `.js`/`.jsx` files (layout.js, page.jsx, api routes, some components)
- **Styling**: CSS Modules only (`.module.css`) — no Tailwind, no styled-components, no CSS-in-JS
- **Editor**: CodeMirror 6 via `@uiw/react-codemirror` (not PrismJS)
- **Icons**: `lucide-react`
- **AI**: Groq API via `/api/ai` proxy (server-side; client calls `src/lib/ai.js`)
- **Themes**: 5 themes via `data-theme` attribute — dark, light, matrix, cyberpunk, dracula

## Directory Layout

```
src/
├── app/
│   ├── layout.js              # Root layout (fonts, Geist, Vercel Analytics)
│   ├── page.jsx               # Dashboard (Favorites, Recent, All Tools)
│   ├── globals.css            # CSS variables + theme definitions
│   ├── tools/[name]/
│   │   ├── page.tsx           # Tool implementation ('use client')
│   │   └── page.module.css
│   └── api/                   # API routes (ai, tester/proxy)
├── components/
│   ├── ClientLayout.tsx       # Wraps all providers
│   ├── {Theme,Favorites,Toast}Provider.tsx
│   ├── common/                # ToolCard, CodeMirrorEditor, AiAssistButton, etc.
│   └── layout/                # Header, Background
├── config/tools.js            # Tool registry (id, title, icon, href, category, etc.)
├── hooks/                     # useUrlState, useHotkeys, useWorker, useHistory, etc.
├── utils/                     # Utility functions
├── workers/                   # Web Workers (json, hash, diff)
└── test/                      # Vitest tests
```

## Conventions (Deviations from Defaults)

### Import Order
```typescript
import { useState } from "react";   // 1. External libs (React first)
import { Copy } from "lucide-react";
import ToolCard from "@/components/common/ToolCard";  // 2. Internal @/ alias
import styles from "./page.module.css";               // 3. Styles last
```

### Tool Pages
- Always `'use client'` (line 1)
- Use `useUrlState("key", "default")` for shareable/persistent state
- Use `const { showToast } = useToast()` for user feedback
- Wrap operations in try/catch with `showToast("msg", "success"|"error")`
- Include AI assistance via `<AiAssistButton>` component pattern
- Register every new tool in `src/config/tools.js` (id, title, description, icon, href, category, etc.)

### Testing
- **Framework**: Vitest + React Testing Library + jsdom
- **Config**: `vitest.config.mjs` — alias `@`→`./src`, CSS modules→`identity-obj-proxy`, env→jsdom
- **Setup**: `src/test/setup.js` — jest-dom matchers, localStorage mock, next/navigation mock
- **Locations**: `src/test/[tool-name].test.jsx`, `src/test/components/`, `src/test/hooks/`, `src/test/utils/`
- **Pattern**: Mock `useUrlState` and `useToast` in every component test

### File Naming
- Components: `PascalCase.tsx`
- Pages: `page.tsx` / `page.js`
- Hooks: `camelCase.ts`
- Styles: `page.module.css` or `ComponentName.module.css`

## Key Gotchas

- **Webpack is mandatory** — `npm run dev` runs `next dev --webpack`; Next.js 16 defaults to Turbopack without this flag
- **TypeScript with mixed JS** — `tsconfig.json` has `strict: true` + `allowJs: true`; some legacy files remain `.js`/`.jsx`
- **`useUrlState` uses `router.replace`** (not `push`) — avoids polluting browser history on every keystroke
- **`.nvmrc`** requires Node 22.22.0; `package.json` engines enforces `>=22.22.0`
- **AI key handling** — `/api/ai` route auto-detects and strips duplicated API keys from paste errors
- **CSS variables** for theming are in `src/app/globals.css`; all 5 themes use `data-theme` attribute
