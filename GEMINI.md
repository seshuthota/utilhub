# UtilHub

**UtilHub** is a comprehensive suite of **28+ developer utilities** built with Next.js 16. The project emphasizes privacy and speed by ensuring all tools run entirely on the client-side.

## Project Overview

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript
- **Styling:** CSS Modules (Vanilla CSS)
- **State Management:** React Hooks + URL State
- **Testing:** Vitest, React Testing Library
- **Icons:** Lucide React

## Building and Running

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
# Server starts at http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
```

## Architecture

### Directory Structure
```
src/
├── app/
│   ├── tools/           # Individual tool pages
│   │   ├── [tool-name]/
│   │   │   ├── page.js           # Tool logic & UI
│   │   │   └── page.module.css   # Tool-specific styles
│   ├── layout.js        # Root layout
│   └── page.jsx         # Dashboard
├── components/
│   ├── common/          # Reusable components (ToolCard, CodeEditor, AiAssistButton)
│   └── layout/          # Layout components
├── config/
│   └── tools.js         # Central registry for all tools
├── hooks/
│   └── useUrlState.js   # Custom hook for URL-based state persistence
└── utils/               # Helper functions
```

### Core Concepts

1.  **Tool Registry (`src/config/tools.js`):**
    All tools are defined here. When adding a new tool, it must be registered in this file with its ID, title, description, icon, and route.

2.  **Client-Side Processing:**
    Tools are implemented as Client Components (`'use client'`). All logic (formatting, converting, generating) happens in the browser to ensure data privacy.

3.  **URL State Persistence:**
    The `useUrlState` hook is used extensively to store tool inputs and configurations in the URL query parameters, making the state shareable.

4.  **AI Integration:**
    Tools utilize a consistent AI assistance pattern via the `AiAssistButton` component, allowing users to ask for help or generate content within the tool context.

## Development Conventions

### Code Style
- **Imports:**
    1.  External libraries (React, Lucide, etc.)
    2.  Internal imports (using `@/` alias)
    3.  Styles (`.module.css`) - *Always last*
- **Naming:**
    - Components: `PascalCase.jsx`
    - Hooks/Utils: `camelCase.js`
    - Styles: `ComponentName.module.css`

### Tool Implementation Pattern
Every tool page (`src/app/tools/[tool-name]/page.js`) generally follows this structure:
1.  **Directives:** `'use client'`
2.  **State:** `useUrlState` for persistent data, `useState` for local UI state.
3.  **AI Section:** An input and `AiAssistButton` for AI features.
4.  **Content:** The main tool interface (often using `CodeEditor`).

### Styling
- Use **CSS Modules** for component-level styling.
- No Tailwind or CSS-in-JS libraries.
- Global variables are defined in `src/app/globals.css`.

### Testing
- **Unit/Integration:** Uses Vitest.
- **Location:**
    - Component tests: `src/test/components/`
    - Tool tests: `src/test/`
    - Hook tests: `src/test/hooks/`
