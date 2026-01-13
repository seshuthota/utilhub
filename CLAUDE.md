# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests with Vitest
```

## Architecture

UtilHub is a Next.js 16 app router project with 28+ client-side developer tools.

### Core Patterns

- **Tool Registry**: All tools are defined in `src/config/tools.js` with id, title, description, icon, and href
- **Tool Pages**: Each tool lives in `src/app/tools/[tool-name]/page.js[x]` with a corresponding `page.module.css`
- **Client Components**: All tool pages use `'use client'` directive since they contain interactive UI
- **CSS Modules**: Styling uses vanilla CSS modules (`.module.css`) - no Tailwind or styled-components

### Component Structure

- `src/components/common/` - Reusable UI components (ToolCard, CommandPalette)
- `src/components/layout/` - Layout components (Header, Background)
- `src/components/ThemeProvider.jsx` - Dark/light theme context
- `src/components/FavoritesProvider.jsx` - User favorites and recent tools state

### Key Files

- `src/app/page.jsx` - Dashboard with tool grid (imports tools from config)
- `src/app/layout.js` - Root layout with ClientLayout wrapper
- `src/app/globals.css` - Global styles and CSS variables

### Dependencies

- **Icons**: `lucide-react`
- **Editor**: `react-simple-code-editor` + `prismjs` for syntax highlighting
- **Diagrams**: `mermaid`
- **Testing**: `vitest` + `@testing-library/react`
