# UtilHub Enhancement Roadmap

> **Created:** 2026-01-15  
> **Based on:** Critical feedback analysis  
> **Status:** 🟡 In Progress

This document tracks planned enhancements and improvements for UtilHub based on comprehensive product feedback.

---

## 📊 Progress Overview

| Phase | Status | Items | Completed |
|-------|--------|-------|-----------|
| Phase 1: Quick Wins | 🟢 Complete | 5 | 5/5 |
| Phase 2: UX Enhancements | � Complete | 6 | 6/6 |
| Phase 3: New Tools | 🔴 Not Started | 6 | 0/6 |
| Phase 4: Performance | 🔴 Not Started | 3 | 0/3 |
| Phase 5: Advanced Features | 🔴 Not Started | 2 | 0/2 |

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
- [ ] **Implement SVGO tool**
  - Use `svgo` library (runs client-side via WASM or pure JS)
  - Input: Raw SVG code or file upload
  - Output: Optimized SVG with size reduction stats
  - Options: Toggle various SVGO plugins (removeComments, cleanupIDs, etc.)
  - Preview: Before/after visual comparison

### 3.2 Docker Run → Compose Converter
- [ ] **Implement Docker command converter**
  - Input: `docker run` command with all flags
  - Output: Valid `docker-compose.yml` file
  - Parse: ports, volumes, env vars, networks, restart policies
  - Handle: Multi-container scenarios (multiple inputs)

### 3.3 Favicon Generator
- [ ] **Implement favicon generation tool**
  - Input: Single image (PNG, JPG, SVG)
  - Output: Complete favicon package
    - `favicon.ico` (16x16, 32x32, 48x48)
    - `apple-touch-icon.png` (180x180)
    - `icon-192.png`, `icon-512.png` (PWA)
    - `manifest.json` snippet
  - All processing client-side using Canvas API

### 3.4 YAML/K8s Validator
- [ ] **Implement YAML validator with K8s awareness**
  - Basic YAML syntax validation
  - Optional K8s schema validation
  - Highlight specific error locations
  - Suggest fixes for common mistakes

### 3.5 GraphQL Schema Tool
- [ ] **Implement GraphQL schema parser and converter**
  - Input: GraphQL schema definition
  - Features:
    - Validate schema syntax
    - Convert to TypeScript types
    - Convert to JSON schema
    - Visualize schema relationships
  - Complements existing JSON-to-TS tool
  - Fully client-side processing

### 3.6 Config Language Converter
- [ ] **Implement multi-format config converter**
  - Support: YAML ↔ JSON ↔ TOML
  - Future: Pkl support when stable
  - Validation for each format
  - Preserve comments where possible
  - Handle complex nested structures

---

## Phase 4: Performance Optimization (Medium-Term)

### 4.1 Web Workers for Heavy Computation
- [ ] **Identify tools requiring Web Workers:**
  - [ ] JSON Formatter (large files)
  - [ ] Hash Generator (large inputs)
  - [ ] Image tools (compression, conversion)
  - [ ] Minifiers (large code files)
  - [ ] Diff Tool (large text comparison)

- [ ] **Create Web Worker infrastructure:**
  - [ ] Worker utility wrapper for consistent API
  - [ ] Progress reporting from workers
  - [ ] Cancellation support for long-running tasks

- [ ] **Implement workers for priority tools:**
  - [ ] JSON Tool worker
  - [ ] Hash Generator worker
  - [ ] Image compression worker

### 4.2 Code Splitting & Lazy Loading
- [ ] **Audit bundle size per tool**
- [ ] **Lazy load heavy dependencies:**
  - Prism.js languages (load on demand)
  - Image processing libraries
  - Crypto libraries

### 4.3 Input Size Limits & Warnings
- [ ] **Add file size detection and warnings**
  - Warn before processing files > 1MB
  - Hard limit or progressive loading for files > 10MB
  - Show estimated processing time

---

## Phase 5: Advanced Features (Long-Term)

### 5.1 Tool Pipelines
- [ ] **Design pipeline architecture**
  - Define standard input/output format per tool
  - Create pipeline builder UI
  - Allow save/load of pipeline configurations
  - URL-shareable pipelines

- [ ] **Implement pipeline execution engine**
  - Chain tool functions programmatically
  - Handle errors gracefully (stop or skip)
  - Show intermediate results

### 5.2 Monaco Editor Integration (Optional)
- [ ] **Evaluate Monaco for Editor Tools category**
  - Assess bundle size impact
  - Compare UX improvement vs. complexity
  - Consider lazy loading Monaco only for specific tools
  
- [ ] **If approved, integrate Monaco:**
  - [ ] SQL Formatter
  - [ ] JSON Tool
  - [ ] Code Minifiers
  - [ ] Markdown Preview

---

## 🚫 Decided Against (With Rationale)

| Feature | Reason |
|---------|--------|
| Full Tailwind migration | Current CSS Modules + variables working well; migration cost outweighs benefits |
| Backend user accounts | Violates privacy-first principle; adds complexity |
| Real-time collaboration | Requires backend; out of scope for privacy-first tool |
| Client-Side Vuln Scanner | Risk of false security; real vulnerability scanning requires dependency resolution, version databases, and continuous updates. A simplified client-side version would miss real issues and potentially give users dangerous false confidence. |
| AI Code Generator | Overlaps with dedicated AI IDEs (Cursor, Copilot); cannot compete effectively in this space |
| Multi-Tab Sessions | High effort with questionable ROI; browser tabs already provide this functionality |

---

## 📝 Technical Debt to Address

- [ ] Ensure all CSS uses design tokens (no hard-coded colors)
- [ ] Standardize component prop interfaces
- [ ] Add TypeScript types (future consideration)
- [ ] Increase test coverage to 80%+
- [ ] Document all public components

---

## 🎯 Success Metrics

1. **Privacy Trust:** Users explicitly mention privacy as a reason for using UtilHub
2. **Performance:** No UI freezes on files up to 10MB
3. **Tool Count:** Reach 35+ high-quality tools
4. **User Retention:** Users return for multiple sessions (via analytics)

---

## 📅 Estimated Timeline

| Phase | Estimated Duration | Target Completion |
|-------|-------------------|-------------------|
| Phase 1 | 2-3 days | Week 1 |
| Phase 2 | 3-4 days | Week 2 |
| Phase 3 | 5-7 days | Week 3-4 |
| Phase 4 | 5-7 days | Week 5-6 |
| Phase 5 | 2-3 weeks | Month 2+ |

---

## 📖 How to Use This Document

1. **Starting work:** Mark items as `[/]` (in progress)
2. **Completing work:** Mark items as `[x]` (done)
3. **Update Progress Overview:** Adjust counts and status emojis
4. **Add notes:** Use blockquotes under items for implementation notes

---

*Last Updated: 2026-01-15 23:52 IST*
*Incorporates feedback from two independent reviews*
