# UtilHub Improvement Plan

_Drafted 2026-10-14 from a five-part code audit of all 42 tools and the shared platform. Status: **approved 2026-10-14 — decisions recorded in §2**._

## 1. Guiding principle

UtilHub is privacy-first: every tool runs in the browser. Anything that must touch the network goes through the **user's own** network or proxy (browser-direct or `npm run proxy:local`), never UtilHub servers. Optional external conveniences (AI via Groq) are opt-in and **visibly badged on the tool page**, before first use.

The audit found the app currently breaks this principle in several places, so restoring it comes before any feature work.

## 2. Decisions (made 2026-10-14)

| # | Decision | Outcome |
|---|---|---|
| D1 | Hosted API proxy (`/api/tester/proxy`) | **Keep as a visible opt-in.** Default "Send via" = Browser; the UtilHub proxy stays selectable but is clearly labelled as going through UtilHub servers, with a warning when chosen. CORS failures point to the local proxy first. |
| D2 | Vercel Analytics | **Keep, scrubbed + opt-out.** `beforeSend` strips query and hash from every event; disclosed on Settings with an opt-out toggle. |
| D3 | How tool state is shared (adopted) | Move tool input from `?query` to the `#fragment` (never sent to servers), debounced, size-capped; secrets (JWT, passwords, curl commands, base64) never persisted unless the user presses Share. |
| D4 | Tool merges (**all approved**) | yaml → Config Converter; SQL Formatter → Beautify (+ query running stays in SQLite, drop alasql); CSS Lint + HTML Lint → one "Lint & Validate"; Email/URL Validator → URL tool + regex preset; Units → split into CSS-units panel and time/bytes in Timestamp. Old URLs redirect. |
| D5 | New tools (later waves, to confirm before Wave 12) | jq/JSONPath playground, X.509/PEM/SSH-key decoder, Graphviz DOT, PDF extract/merge/split, Unicode/string inspector. |

## 3. Wave 0 — Privacy, security, and a green test suite (do first)

### 0A. Stop data leaving the browser
- Replace `useUrlState` with `useToolState(key, default, { persist: 'fragment' | 'none', sensitive, maxBytes })` using debounced `history.replaceState`. Today it calls `router.replace` on every keystroke, putting tool input in the query string (16 tools) — browser history, analytics, likely RSC requests to the server, and 414 errors on big inputs.
  - Sensitive by default: jwt `token`, curl `curl`, base64 `input`, any secret field.
  - Verify first in DevTools whether `?…&_rsc=` requests carry input (unconfirmed by audit).
- "Send to…" (`ActionToolbar.tsx:55,134`) and command-palette detection (`CommandPalette.tsx:107`) pass data via `sessionStorage` handoff, not URL params.
- Self-host Wasm currently fetched from third parties (also fixes offline/PWA):
  - sql.js from `sql.js.org` (`sqlite/page.tsx:100`)
  - dprint plugins from `plugins.dprint.dev` (`dprintFormatter.ts:9-14`)
- Workbox catch-all `/.*/` caches cross-origin responses (API Client results, RSC payloads) for 30 days → restrict to same-origin, exclude `/api`. Remove dead Google Fonts cache rules.
- API Client: apply D1 (done before Wave 0); add origin + rate checks to the hosted route.
- `autoComplete="off" spellCheck={false}` on all secret inputs (password, jwt secret, API auth). `<meta name="referrer" content="no-referrer">`.
- Analytics per D2.

### 0B. Close XSS holes
- Replace the regex blocklist `src/utils/sanitize.ts` with DOMPurify (already in the tree). Confirmed bypasses in markdown (`<img/src=x/onerror=…>`) and SVG optimizer (`xlink:href="javascript:"`, `<animate>`), reachable from shared links.
- Shared `<SafeSvgPreview>` (renders via `<img src=blob:>`) for svg + mermaid; mermaid `securityLevel: 'strict'`.
- `npm audit fix` + Next 16.1 → 16.4 (critical advisory). 56 prod advisories today; the critical shell-quote/ws chain comes from `alasql → react-native-fs` (removed by D4).

### 0C. Honest badges
- Fix `hasAiFeatures` (wrong for sql, mermaid, lorem, json-schema).
- New "Network" badge (API Client, QR scanner camera is local so no).
- `PrivacyBadge` on every tool page header, not just dashboard cards; AI tools must not also claim "data never leaves your browser" (`PrivacyBadge.tsx:28`).
- json-schema AI sends the user's full data + schema — say so in the AI bar.

### 0D. Test suite and hygiene
- 17 failing tests, one root cause: 5 test files mock the deleted `@/components/common/CodeEditor`, so real CodeMirror mounts and the `ResizeObserver` mock in `src/test/setup.js:59` isn't constructible under Vitest 4. Repoint mocks to `CodeMirrorEditor`, make the mock a class, delete `code-editor.test.jsx` (tests a deleted component).
- Command palette test targets the dead `src/components/CommandPalette.jsx` — retarget to the live `common/CommandPalette.tsx`, delete the dead one.
- Remove unused deps: `crypto-js`, `@babel/parser`, `@babel/standalone`, `zod`, `clsx`, `jwt-decode`, `@types/crypto-js`, `@types/prismjs`. Delete dead `diff.worker.js`, `hash.worker.js`, `useKeyboardShortcuts.js`. Move `curlconverter` to dependencies. Move or delete `src/__tests__/ai-regex.test.js` (never runs).
- Shell bugs:
  - `ThemeProvider.tsx:55` returns `null` until mounted → every page SSRs an empty body. Use an inline pre-hydration theme script.
  - Per-tool `<title>` broken (`tools/layout.js:5` reads a nonexistent `params.slug`).
  - ErrorBoundary doesn't reset on navigation.
  - Settings "Clear all data" only clears favorites/recents.
  - PWA: manifest icons missing (not installable), duplicate SW registration, generated `public/sw.js` tracked in git.
  - Recents only recorded on card clicks.

**Exit criteria:** zero tool input in URLs/analytics/server logs (verified in Network tab), no third-party runtime fetches, `npx vitest run` fully green, `npm audit --omit=dev` with no critical/high in shipped code.

## 4. Wave 1 — Shared foundations

Built once, then every tool wave uses them. Adoption today is low (e.g. `ActionToolbar` 8/42 tools, `HistorySidebar` 2, file drop 3, `EmptyState` 0, 22 tools have no mobile CSS, almost no `aria-*`).

- `<ToolShell id>` — h1, description, badges, Share (fragment), history toggle, shortcut hints from the registry.
- `useToolState` (from 0A), `useCopy()` (8+ hand-rolled clipboard calls, none awaited), `useObjectUrl()` (URL leaks in image/favicon).
- `<FileDropZone accept maxBytes onFile>` — click, drop, paste, keyboard-accessible.
- `downloadBlob` with deferred revoke (current one races in Safari).
- `<Modal>` with focus trap/restore (palette, shortcuts help, AI disclaimer all lack it); toasts get `aria-live`.
- `useDiagnostics` — CodeMirror lint gutter + line/column for parse errors (no tool marks errors in the editor today).
- `runInWorker(fn, { timeoutMs })` on top of `useWorker`, for regex/diff/format/parse.
- Pure transform modules in `src/utils/<tool>.ts` imported by **both** the page and its pipeline adapter. Adapters have drifted: base64 uses `btoa` (crashes on non-Latin-1), jwt `atob` (garbles UTF-8), xml "minify" doesn't minify, case-converter has two different tokenizers.
- Global CSS: define the missing `btn-primary/secondary/icon` classes or remove them; fix the `justify_content` typo in 6 CSS files; standard responsive two-pane layout.

## 5. Tool waves (2–3 tools per wave, run in parallel)

Each item lists confirmed problems first, then the target. Effort: S < 1 day, M 1–3 days, L 3+ days.

### Wave 2 — Fix what's broken (many S items, split across 2–3 agents)
| Tool | Fix |
|---|---|
| Beautify | Prettier mode broken for JS/TS/JSON (missing `estree` plugin, `beautify/page.tsx:38-46`). "Minify" is `replace(/\s+/g," ")` and corrupts code → terser / lightningcss / html-minifier-terser. |
| Regex | Presets without `g` crash (`matchAll`, `regex/page.tsx:48`). Catastrophic patterns freeze the tab → worker + timeout. |
| Timestamp | UTC/local round-trip shifts by your offset (`toISOString` into `datetime-local`, `:34,52,70`); 13-digit ms read as seconds; empty → 1970. |
| JSON Schema | Crashes on 2nd keystroke for schemas with `$id` (shared Ajv); `format: email` errors; draft 2020-12 unsupported → ajv-formats + Ajv2020. |
| YAML / YAML Validator | Multi-document (`---`) files rejected; every non-K8s file flagged "Invalid Kubernetes"; tab click can overwrite input. |
| XML | Format silently deletes comments. |
| Config Converter | Swap corrupts URL state; TOML drops nulls silently. |
| GraphQL → TS | `[User!]` treated as required; nested lists flattened. |
| CSV | Parse warning leaves stale table. |
| UUID | "v1" isn't RFC v1; v7 not monotonic within a millisecond. |
| Chmod | Copied symbolic command (`chmod -rwxr-xr-x`) is invalid; no setuid/setgid/sticky. |
| IP Subnet | Accepts `999.1.1.1`; /31 and /32 wrong; incomplete private ranges. |
| Color | "Contrast Safe" badge is always shown; YIQ instead of WCAG. |
| Base64 | Invalid input never reported; decode mode not shared. |
| Pipeline | Share links break on `+` in base64 (`persistence.js:144`); reorder UI is a no-op. |
| Image | Double lossy compression; object URL leaks; 0×0 export; WebP fallback mislabeled. |
| Favicon | Corrupt file → infinite spinner; non-square stretched; single-size ICO. |
| QR | No download; long text crashes render. |
| Lorem | Unclamped count can hang the tab. |
| Case converter | `HELLO_WORLD`→`hELLOWORLD`, `XMLHttpRequest`→`xmlhttp_request`. |
| Cron | 6-field AWS misread as seconds-first; Quartz DOW off by one; 7-field errors. |
| Diff | Debounce ineffective in live mode — full diff + patch on every keystroke. |

### Wave 3 — JSON flagship + data-format hub
- **JSON**: fragment state; parse once + graph layout in worker; collapsible tree view; error gutter; JSONPath/JMESPath query panel; JSON5/JSONC repair; sort keys; value previews (jsonhero-style). Fix size detection for URL/history-loaded input.
- **Config Converter** (absorbs YAML Converter): JSON/YAML/TOML + XML, CSV, `.env`, properties, JSON5; multi-doc YAML; lossy-conversion warnings; TOML highlighting.

### Wave 4 — Regex Studio + Diff
- **Regex**: AST explainer (regexpp) replacing the char-level one; real ReDoS detection; capture-group table with indices; flag chips; named substitution preview; unit-test style cases; code export (JS/Python/Go). regex101 parity.
- **Diff**: worker + virtualized rows; lazy patch; semantic JSON diff (ignore key order); merge/apply-hunk.

### Wave 5 — Security tools
- **JWT**: asymmetric verify (RS/PS/ES/EdDSA via PEM/JWK/JWKS + `kid` match); base64 secret toggle; case-sensitive alg + warn when signing rewrites alg; JWE detection; colour-coded segments.
- **Password → "Password Generator & Audit"**: CSPRNG generator (charset, passphrase/EFF wordlist, exclude ambiguous), lazy zxcvbn, entropy; optional badged HIBP k-anonymity check.
- **Hash**: streaming worker hashing with progress/cancel (currently loads whole file, hashes 5× on main thread); verify-against-expected; HMAC; BLAKE3/CRC32/xxhash; SHA256SUMS verification.

### Wave 6 — Code quality tools (merges per D4)
- **Beautify** becomes the formatter hub: options panel (print width, quotes, tabs), absorbs SQL formatting (dialects, keyword case), worker, before/after diff.
- **Lint & Validate** (new, replaces CSS Lint + HTML Validator — both are regex heuristics with false positives): css-tree/stylelint + HTMLHint/parse5 + axe-core subset, lint gutter, autofix.
- **SQLite**: query worker with cancel; schema from DB; multi-statement results; "Open CSV as table" link from CSV. Retire the alasql SQL page.

### Wave 7 — Media (shared file module)
- **Image → Squoosh-lite**: OffscreenCanvas worker, `toBlob`, before/after slider with sizes, MozJPEG/OxiPNG/AVIF via jSquash Wasm, batch ZIP, crop/rotate, pixel cap.
- **SVG Optimizer**: full SVGO plugin list + precision, checkerboard bg, copy as data URI/JSX, mobile layout.
- **Favicon**: multi-size ICO, pad/crop, manifest name/colour fields, HTML `<link>` snippet, maskable/dark previews.

### Wave 8 — Visual tools
- **Color → "Color & Contrast"**: parse any CSS colour, WCAG ratio + AA/AAA + nearest passing colour, alpha/OKLCH, palettes/tints, colour-blind preview, export CSS vars/Tailwind.
- **Mermaid**: theme sync, error line markers, PNG export, pan/zoom, template gallery.
- **QR**: PNG/SVG download, size/colour/ECC, WiFi/vCard/geo templates, lazy-loaded scanner, scan-again.

### Wave 9 — Encoding & time
- **Encode/Decode workbench** (base64 + url + hex + HTML entities + base32/58): auto-detect, URL-safe/no-pad, bytes/hex view for binary, file ↔ base64, data-URI preview, URL parser with editable query table. `/tools/base64` and `/tools/url` stay as presets.
- **Number base**: signed/two's complement, bit widths, any base 2–36, bit grid, IEEE-754.
- **Timestamp**: timezone picker + multi-zone table, relative time, any-format paste, date difference (absorbs time units from Units).
- **Cron**: dialect selector (Unix/Quartz/AWS/k8s), timezone, per-field explanations, next-N runs.

### Wave 10 — Codegen & schemas
- **JSON → Types** (replaces json-to-ts): quicktype-core in browser (TS, Zod, Go, Rust, Python…) — fixes shape merging, root arrays, naming.
- **GraphQL**: correct type mapping, `buildSchema` validation, unions/interfaces/args, introspection → SDL, breaking-change diff.
- **YAML Lint & Schema Validate**: per-doc results, bundled K8s/compose/GitHub Actions schemas (SchemaStore), shared Ajv core with JSON Schema.
- **CSV**: file drop, Papa worker, virtualized sortable table, delimiter/header options, JSON→CSV, export to SQL/Markdown.

### Wave 11 — Smaller tools
cURL converter (more targets, warnings panel, syntax highlighting for all output languages, "Open in API Client"); Docker (multi-service, compose→run); Markdown (code highlighting, synced scroll, TOC, Mermaid fences, export); Case converter (per-line, shared tokenizer); Lorem; Units/Validate merges per D4.

### Wave 12 — New tools (per D5)
jq/JSONPath playground (jq-wasm) · X.509/PEM/CSR/SSH-key decoder · Graphviz DOT (@hpcc-js/wasm) · PDF extract/merge/split (pdf.js + pdf-lib) · Unicode/string inspector.

### Wave 13 — Shell polish & docs
Command palette listbox semantics + focus trap; dashboard tablist keyboard nav; 5-theme toggle; dracula contrast (3.79:1); mobile header label; recents on route change. Rewrite README, PROJECT_REFERENCE, ROADMAP, AGENTS.md to match reality.

## 6. How each wave runs

1. Wave 0–1 are done mostly by the lead session (they touch shared files); tool waves use 2–3 parallel agents, each in its own git worktree and owning disjoint tool folders.
2. Shared files (`src/config/tools.js`, `src/utils/pipeline/adapters.js`, `next.config.mjs`, `package.json`) are changed only by the lead during integration, to avoid conflicts.
3. Each agent: implements against this plan, adds/updates tests (including regression tests for every confirmed bug), runs lint, `tsc`, and the tool's tests, and reports what changed and what it skipped.
4. Lead: reviews the diff, runs the full suite and a production build, checks the tool in a browser, then commits one commit per tool on a feature branch.
5. User reviews at the end of each wave before the next starts.

## 7. Already done (uncommitted, in working tree)
API Client rework: `{{var}}` fixes, local-proxy origin allowlist, SSRF guard, safe previews, collections with folders, Postman/`.http`/UtilHub import-export, share links, API Tester merged, D1 applied (Browser default, UtilHub proxy as labelled opt-in).
