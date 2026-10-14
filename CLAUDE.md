# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                                # Node >=22.22.0 (see .nvmrc)
npm run dev                                # next dev --webpack, http://localhost:3000
npm run build                              # next build --webpack
npm run lint                               # ESLint (eslint-config-next)
npx vitest run                             # All tests, single run (`npm test` = watch mode in a TTY)
npx vitest run src/test/base64.test.jsx    # Single test file
npx vitest run -t "encodes text"           # Single test by name
npx vitest run --coverage                  # Coverage (v8) -> ./coverage
npm run proxy:local                        # Local exact-header API proxy on 127.0.0.1:3927
```

- **Webpack is mandatory.** Scripts pass `--webpack`; Next.js 16 defaults to Turbopack, which this config (custom webpack rules, `node-loader`, fs/path/crypto fallbacks, next-pwa) does not support.
- Vitest only picks up `src/test/**/*.test.{js,jsx}` (see `vitest.config.mjs`). Files elsewhere (e.g. `src/__tests__/`) are not run.

## Architecture

Next.js 16 App Router app with 42 developer tools. The product rule is privacy-first: tools run in the browser, network features use the user's own network/proxy, and anything that calls an external service (AI via Groq, the opt-in hosted API proxy) must be opt-in and visibly badged. The approved roadmap is `docs/IMPROVEMENT_PLAN.md`. TypeScript with `allowJs` — tool pages and components are `.tsx`, while some legacy files (`layout.js`, `page.jsx`, API routes, `config/tools.js`, pipeline utils) are still JS.

### Tool registry and pages

- `src/config/tools.js` is the single source of truth for tools (`id`, `title`, `description`, `icon`, `href`, `category`, `isClientSideOnly`, `hasAiFeatures`). The dashboard, command palette, category filters, and per-tool metadata (`src/app/tools/layout.js` `generateMetadata`) all derive from it. A new tool must be registered here.
- Each tool is `src/app/tools/<name>/page.tsx` (`'use client'`) + `page.module.css`. The folder name is not always the tool `id` — match on `href`.
- Common tool-page building blocks: `useUrlState(key, default)` (`src/hooks/useUrlState.ts`) syncs inputs into query params via `router.replace` so tool state is shareable/survives refresh; `useToast()` from `@/components/Toast` for feedback; `ActionToolbar`, `CodeMirrorEditor`, `HistorySidebar` (+ `useHistory`), `AiAssistButton`/`AiAssistBar` in `src/components/common/`.
- Editors use CodeMirror 6 (`@uiw/react-codemirror`), not Prism.
- Heavy work (JSON, hashing, diff) goes through Web Workers in `src/workers/` via `useWorker`. Wasm libs (`hash-wasm`, `photon-web`, `@dprint/formatter`) are lazy-loaded.

### Providers / app shell

`src/components/ClientLayout.tsx` wraps everything with Theme, Favorites (favorites + recents in localStorage), and Toast providers, plus the command palette, error boundary, and service worker registration. Themes are set via a `data-theme` attribute with CSS variables in `src/app/globals.css` (dark, light, matrix, cyberpunk, dracula). Styling is CSS Modules only.

### Pipeline (tool chaining)

`src/utils/pipeline/` lets tools be chained (`/tools/pipeline` and "Send to…" menus). `adapters.js` holds a per-tool registry of input/output `IO_TYPES` and a pure `transform(input, options)` function; `engine.js` runs chains; `persistence.js` handles saved/shareable pipelines. A tool only participates in chaining if it has an adapter here — the adapter re-implements the transform independently of the tool page.

### Server-side pieces (the only non-client code)

- `src/app/api/ai/route.js` — proxies AI requests to Groq using `GROQ_API_KEY` (from `.env*`, gitignored). Prompt templates live in `src/app/api/ai/prompts.js`, keyed by a `type` string; clients call `generate(type, payload)` from `src/lib/ai.js`. New AI features add a case to `getPrompt`.
- `src/app/api/tester/proxy/route.js` — opt-in hosted proxy for the API Client (`/tools/curl-tester`; browser-direct is the default). Blocks private networks in production. Shares `executeProxyRequest` from `src/utils/httpExactProxy.js` with `scripts/local-api-proxy.mjs` (a local proxy that avoids Vercel-injected headers); keep that util importable from plain Node.

### PWA

`next.config.mjs` wraps the config with `@ducanh2912/next-pwa` (disabled in development) and Workbox runtime caching; generated service-worker files land in `public/`.

## Testing conventions

- Setup in `src/test/setup.js` (jest-dom matchers, localStorage mock, `next/navigation` mock). `@` aliases to `src/`, CSS modules map to `identity-obj-proxy`.
- Tool page tests import the page directly and mock `@/hooks/useUrlState` (with a plain `useState`) and `@/components/Toast`; heavy child components like `ActionToolbar` are often mocked to `null`. See `src/test/base64.test.jsx`.
- Layout: `src/test/<tool>.test.jsx`, plus `src/test/{components,hooks,utils}/`.

## Other docs

`AGENTS.md` (conventions incl. import order and file naming), `src/PROJECT_REFERENCE.md` (feature/tool catalog), `ROADMAP.md`.
