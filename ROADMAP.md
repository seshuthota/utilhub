# UtilHub Enhancement Roadmap

> **Created:** 2026-01-15  
> **Based on:** Critical feedback analysis  
> **Status:** 🟢 Phase 5 Complete

---

## 📊 Progress Overview

| Phase                      | Status      | Items | Completed |
| -------------------------- | ----------- | ----- | --------- |
| Phase 1: Quick Wins        | 🟢 Complete | 5     | 5/5       |
| Phase 2: UX Enhancements   | 🟢 Complete | 6     | 6/6       |
| Phase 3: New Tools         | 🟢 Complete | 6     | 6/6       |
| Phase 4: Performance       | 🟢 Complete | 3     | 3/3       |
| Phase 5: Advanced Features | 🟢 Complete | 2     | 2/2       |

---

## Phase 1: Quick Wins (Immediate Priority)

These are high-impact, low-effort improvements that can be implemented quickly.

### 1.1 Privacy Badges ✅

- [x] **Add "🔒 Client-Side Only" badge component**
  - Created reusable `PrivacyBadge` component with two variants
  - Styled with green (client-side) and purple (AI) themes
  - Added tooltip explaining what each badge means

- [x] **Apply badges to sensitive tools:**
  - [x] All 34 tools now have `isClientSideOnly` metadata
  - [x] Badges display automatically on ToolCard based on metadata
  - [x] AI-enabled tools show purple "AI-Powered" badge

### 1.2 AI Transparency Disclaimer ✅

- [x] **Add AI data transmission warning**
  - Created `AiDisclaimer` modal component
  - Shows on first AI feature use
  - "Don't show again" checkbox with localStorage persistence
  - Links to Groq privacy policy
- [x] **Update tools with AI features:**
  - [x] Integrated into `AiAssistButton` (global for all AI tools)
  - [x] JSON, Regex, Cron, RegEx Generator marked with `hasAiFeatures: true`

### 1.3 Tool Registry Enhancements ✅

- [x] **Add metadata to `tools.js` config:**
  - `isClientSideOnly: boolean` — Added to all 34 tools
  - `hasAiFeatures: boolean` — Added to all 34 tools
  - `category: string` — Added to all 34 tools
  - Added helper functions: `getToolById()`, `getToolsByCategory()`, `getCategories()`

### 1.4 UI Consistency Audit ✅

- [x] **Review and document CSS variable usage**
  - Fixed hard-coded colors in `validate`, `csv`, `yaml`, `css-lint`, `api-tester` CSS
  - Replaced `#ff4444` → `var(--error-color)`
  - Replaced `#00C851` → `var(--success-color)`
  - Replaced `#ffbb33` → `var(--warning-color)`

### 1.5 Accessibility Quick Fixes ✅

- [x] **Add aria-labels to icon-only buttons**
  - Fixed `ShortcutsHelpModal`, `CommandPalette`, `ErrorBoundary`
  - All new components (`PrivacyBadge`, `AiDisclaimer`) built with accessibility
- [x] **Add aria-hidden to decorative icons**
- [x] **Add role="dialog" and aria-modal to modals**

---

## Phase 2: UX Enhancements (Short-Term)

### 2.1 Smart Detection in Command Palette (Cmd+K)

- [x] **Implement input auto-detection**
  - Detect JWT tokens (`ey...` prefix)
  - Detect SQL queries (`SELECT`, `INSERT`, `UPDATE`, etc.)
  - Detect Unix timestamps (10-13 digit numbers)
  - Detect JSON strings (`{` or `[` prefix)
  - Detect Base64 encoded strings
  - Detect UUIDs (pattern match)
  - Detect URLs (http/https prefix)
  - Detect cron expressions (5-6 space-separated values)

- [x] **Show suggested tools based on detection**
  - Display in Command Palette results
  - Allow one-click navigation with pre-filled input

### 2.2 Enhanced Copy Feedback

- [x] **Improve toast notifications**
  - Show what was copied (truncated preview)
  - Add subtle animation
  - Ensure accessibility (announced to screen readers)

### 2.3 Tool Chaining Preview (UI Only)

- [x] **Add "Send to..." button on tool outputs**
  - When a tool produces output, show quick actions
  - Example: JSON output → "Send to: JWT Decoder, Base64 Encode, Minify"
  - This is a stepping stone to full pipelines

### 2.4 Improved Error Messages

- [x] **Add contextual error helpers**
  - When JSON parsing fails, show line/column of error
  - When regex is invalid, explain the syntax issue
  - When API requests fail, show common solutions

### 2.5 Local Usage Analytics Dashboard

- [x] **Track personal tool usage stats (fully offline)**
  - Store usage data in localStorage
  - Track: most-used tools, usage frequency, time spent
  - Visualize with simple charts (no external dependencies)
  - Export/clear data options for user control
  - Zero data leaves the browser

### 2.6 Mermaid AI Enhancement

- [x] **Add AI-powered diagram generation to Mermaid tool**
  - Input: Natural language description (e.g., "user login flow with OAuth")
  - Output: Generated Mermaid syntax
  - Uses existing Groq integration
  - Clear AI disclaimer when feature is used

---

## Phase 3: New Tools (Short-Term)

### 3.1 SVG Optimizer (SVGO)

- [x] **Implement SVGO tool**
  - Use `svgo` library (runs client-side via WASM or pure JS)
  - Input: Raw SVG code or file upload
  - Output: Optimized SVG with size reduction stats
  - Options: Toggle various SVGO plugins (removeComments, cleanupIDs, etc.)
  - Preview: Before/after visual comparison

### 3.2 Docker Run → Compose Converter

- [x] **Implement Docker command converter**
  - Input: `docker run` command with all flags
  - Output: Valid `docker-compose.yml` file
  - Parse: ports, volumes, env vars, networks, restart policies
  - Handle: Multi-container scenarios (multiple inputs)

### 3.3 Favicon Generator

- [x] **Implement favicon generation tool**
  - Input: Single image (PNG, JPG, SVG)
  - Output: Complete favicon package
    - `favicon.ico` (16x16, 32x32, 48x48)
    - `apple-touch-icon.png` (180x180)
    - `icon-192.png`, `icon-512.png` (PWA)
    - `manifest.json` snippet
  - All processing client-side using Canvas API

### 3.4 YAML/K8s Validator

- [x] **Implement YAML validator with K8s awareness**
  - Basic YAML syntax validation
  - Optional K8s schema validation
  - Highlight specific error locations
  - Suggest fixes for common mistakes

### 3.5 GraphQL Schema Tool

- [x] **Implement GraphQL schema parser and converter**
  - Input: GraphQL schema definition
  - Features:
    - Validate schema syntax
    - Convert to TypeScript types
    - Convert to JSON schema
    - Visualize schema relationships
  - Complements existing JSON-to-TS tool
  - Fully client-side processing

### 3.6 Config Language Converter

- [x] **Implement multi-format config converter**
  - Support: YAML ↔ JSON ↔ TOML
  - Future: Pkl support when stable
  - Validation for each format
  - Preserve comments where possible
  - Handle complex nested structures

---

## Phase 4: Performance Optimization (Medium-Term)

### 4.1 Web Workers for Heavy Computation

- [x] **Identify tools requiring Web Workers:**
  - [x] JSON Formatter (large files)
  - [x] Hash Generator (large inputs)
  - [x] Diff Tool (large text comparison)
  - [ ] Image tools (compression, conversion) - Canvas API runs on main thread
  - [ ] Minifiers (large code files) - Use beautify tool with lazy loading

- [x] **Create Web Worker infrastructure:**
  - [x] Worker utility wrapper (`src/utils/worker.js`)
  - [x] Progress reporting from workers
  - [x] Cancellation support for long-running tasks
  - [x] useWorker hook (`src/hooks/useWorker.js`)

- [x] **Implement workers for priority tools:**
  - [x] JSON Tool worker (`src/workers/json.worker.js`)
  - [x] Hash Generator worker (`src/workers/hash.worker.js`)
  - [x] Diff worker (`src/workers/diff.worker.js`)

### 4.2 Code Splitting & Lazy Loading

- [x] **Lazy load Prism.js languages:**
  - [x] Dynamic import of language modules on demand
  - [x] `CodeEditor.jsx` updated with lazy loading
  - [x] `preloadLanguage()` and `getAvailableLanguages()` utilities

- [x] **Lazy load Prettier plugins in beautify tool:**
  - [x] Dynamic import of Prettier plugins on demand
  - [x] Dynamic import of SQL and XML formatters
  - [x] Optimized bundle - only load needed formatters

- [ ] **Audit bundle size per tool** - Requires build analysis
- [ ] **Dynamic imports for heavy libraries** - Future enhancement

### 4.3 Input Size Limits & Warnings

- [x] **Create input size management:**
  - [x] `useInputSize` hook (`src/hooks/useInputSize.js`)
  - [x] Size thresholds (warning: 100KB-1MB, heavy: 1-5MB, critical: 5-10MB)
  - [x] Estimated processing time calculation
  - [x] Size warnings UI component

- [x] **Add file size detection and warnings:**
  - [x] Text input size warnings (JSON, Hash, Diff, Beautify tools)
  - [x] File upload size limits (Image tool - 20MB limit)
  - [x] Visual indicators for large files

- [x] **Hard limit for files > 10-20MB** - Implemented per tool type

---

## Phase 5: Advanced Features (Long-Term)

### 5.1 Tool Pipelines

- [x] **Design pipeline architecture**
  - [x] Define standard input/output format per tool (`src/utils/pipeline/types.js`)
  - [x] Create tool adapters for 10+ compatible tools
  - [x] Type compatibility matrix for automatic conversions

- [x] **Implement pipeline execution engine**
  - [x] Async execution with progress reporting (`src/utils/pipeline/engine.js`)
  - [x] Error handling with graceful fallbacks
  - [x] Intermediate result storage for debugging

- [x] **Create pipeline builder UI**
  - [x] Visual step builder (`/tools/pipeline`)
  - [x] Drag-and-drop step ordering
  - [x] Tool selector with capability display

- [x] **Save/load pipeline configurations**
  - [x] localStorage persistence (`src/utils/pipeline/persistence.js`)
  - [x] Import/export as JSON
  - [x] Saved pipelines management

- [x] **URL-shareable pipelines**
  - [x] Compressed URL encoding
  - [x] Load pipeline from URL parameters
  - [x] Share button copies URL to clipboard

### 5.2 Monaco Editor Integration (Optional)

- [ ] **Evaluate Monaco for Editor Tools category**
  - [ ] Bundle size impact assessment needed
  - [ ] Compare UX improvement vs. complexity
  - [ ] Consider lazy loading Monaco only for specific tools
- [ ] **If approved, integrate Monaco:**
  - [ ] SQL Formatter
  - [ ] JSON Tool
  - [ ] Code Minifiers
  - [ ] Markdown Preview

---

## 🚫 Decided Against (With Rationale)

| Feature                  | Reason                                                                                                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full Tailwind migration  | Current CSS Modules + variables working well; migration cost outweighs benefits                                                                                                                                                               |
| Backend user accounts    | Violates privacy-first principle; adds complexity                                                                                                                                                                                             |
| Real-time collaboration  | Requires backend; out of scope for privacy-first tool                                                                                                                                                                                         |
| Client-Side Vuln Scanner | Risk of false security; real vulnerability scanning requires dependency resolution, version databases, and continuous updates. A simplified client-side version would miss real issues and potentially give users dangerous false confidence. |
| AI Code Generator        | Overlaps with dedicated AI IDEs (Cursor, Copilot); cannot compete effectively in this space                                                                                                                                                   |
| Multi-Tab Sessions       | High effort with questionable ROI; browser tabs already provide this functionality                                                                                                                                                            |

---

## 📝 Technical Debt to Address

- [x] Ensure all CSS uses design tokens (no hard-coded colors)
  - Created `AiAssistBar` to standardize AI input styles
  - Added `--accent-ai` token and refactored 8 tools
- [x] Standardize component prop interfaces
  - [x] Add `className` and `style` to shared components (`HistorySidebar`, `ToolCard`, etc.)
  - [x] Standardize modal visibility (`isOpen`) for `ShortcutsHelpModal`
- [ ] Add TypeScript types (future consideration)
- [x] Increase test coverage to 80%+
  - Achieved >85% on critical tools (Chmod, GraphQL, ActionToolbar, AiDisclaimer)
  - Improved overall project coverage to ~71%
- [x] Document all public components
  - Added JSDoc to all 16 components in `components/common`
  - Added JSDoc to layout and root components

---

## 🎯 Success Metrics

1. **Privacy Trust:** Users explicitly mention privacy as a reason for using UtilHub
2. **Performance:** No UI freezes on files up to 10MB
3. **Tool Count:** Reach 35+ high-quality tools
4. **User Retention:** Users return for multiple sessions (via analytics)

---

## 📅 Estimated Timeline

| Phase   | Estimated Duration | Target Completion |
| ------- | ------------------ | ----------------- |
| Phase 1 | 2-3 days           | Week 1            |
| Phase 2 | 3-4 days           | Week 2            |
| Phase 3 | 5-7 days           | Week 3-4          |
| Phase 4 | 5-7 days           | Week 5-6          |
| Phase 5 | 2-3 weeks          | Month 2+          |

---

## 📖 How to Use This Document

1. **Starting work:** Mark items as `[/]` (in progress)
2. **Completing work:** Mark items as `[x]` (done)
3. **Update Progress Overview:** Adjust counts and status emojis
4. **Add notes:** Use blockquotes under items for implementation notes

---

_Last Updated: 2026-01-16_
_Incorporates feedback from two independent reviews_
