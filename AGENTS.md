# AGENTS.md

This file provides guidance to agentic coding agents working in the UtilHub Next.js codebase.

## Commands

### Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000 (uses webpack)
npm run build        # Production build (uses webpack)
npm run start        # Start production server
```

### Code Quality

```bash
npm run lint         # Run ESLint with Next.js core-web-vitals config
npm test             # Run tests once with Vitest
npm run test:watch   # Run tests in watch mode
```

### Testing Individual Files

```bash
# Run a specific test file
npm test src/test/dashboard.test.jsx

# Run tests matching a pattern
npm test src/test/hooks/

# Run with coverage
npm test -- --coverage
```

## Architecture Overview

UtilHub is a Next.js 16 app router project with 28+ client-side developer tools.

### Core Patterns

- **Tool Registry**: All tools defined in `src/config/tools.js` with standardized structure
- **Tool Pages**: Each tool in `src/app/tools/[tool-name]/page.js` with corresponding `page.module.css`
- **Client Components**: All tool pages use `'use client'` directive (interactive UI)
- **CSS Modules**: Vanilla CSS modules only - no Tailwind or styled-components
- **Webpack**: Explicitly configured with `--webpack` flag for both dev and build

### Directory Structure

```
src/
├── app/
│   ├── layout.js              # Root layout with fonts/analytics
│   ├── page.jsx              # Dashboard with tool grid
│   ├── globals.css           # Global styles + CSS variables
│   ├── tools/[tool-name]/
│   │   ├── page.js           # Tool implementation
│   │   └── page.module.css   # Tool-specific styles
│   └── api/                  # API routes
├── components/
│   ├── common/               # Reusable UI (ToolCard, CodeEditor, etc.)
│   ├── layout/               # Layout components (Header, Background)
│   └── [Provider].jsx       # Context providers
├── config/
│   └── tools.js              # Tool registry
├── hooks/                    # Custom React hooks
├── utils/                    # Utility functions
└── test/                     # Test files
```

## Code Style Guidelines

### Import Order

```javascript
// 1. External libraries (React first)
import { useState, useEffect } from "react";
import { Search, Copy } from "lucide-react";

// 2. Internal imports with @ alias
import ToolCard from "@/components/common/ToolCard";
import { tools } from "@/config/tools";
import { useUrlState } from "@/hooks/useUrlState";

// 3. Styles (always last)
import styles from "./page.module.css";
```

### File Naming Conventions

- **Components**: `PascalCase.jsx` (e.g., `ToolCard.jsx`)
- **Pages**: `page.js` (Next.js convention)
- **Hooks**: `camelCase.js` (e.g., `useHotkeys.js`)
- **Utils**: `camelCase.js` (e.g., `regex.js`)
- **Styles**: `page.module.css` or `ComponentName.module.css`

### Component Structure

```javascript
"use client"; // Required for all interactive components

import { useState } from "react";
import { Icon } from "lucide-react";
import styles from "./page.module.css";

export default function ComponentName() {
  // 1. State hooks (URL state first, then local state)
  const [value, setValue] = useUrlState("key", "default");
  const [localState, setLocalState] = useState("");

  // 2. Custom hooks
  const { showToast } = useToast();

  // 3. Event handlers
  const handleClick = () => {
    try {
      // Operation
      showToast("Success", "success");
    } catch (error) {
      showToast("Error occurred", "error");
    }
  };

  // 4. Keyboard shortcuts (if applicable)
  useHotkeys("Enter", handleClick, { meta: true });

  // 5. Render
  return <div className={styles.container}>{/* JSX content */}</div>;
}
```

### Tool Page Pattern

All tool pages follow this consistent structure:

```javascript
"use client";

import { useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToast } from "@/components/Toast";
import AiAssistButton from "@/components/common/AiAssistButton";
import CodeEditor from "@/components/common/CodeEditor";
import ShareButton from "@/components/common/ShareButton";
import styles from "../markdown/page.module.css"; // Reuse shared styles

export default function ToolPage() {
  // URL state for persistence
  const [input, setInput] = useUrlState("input", "default");
  const [aiPrompt, setAiPrompt] = useState("");
  const { showToast } = useToast();

  // AI result handler (consistent pattern)
  const handleAiResult = (response) => {
    // Process AI response
    setInput(processedResponse);
  };

  // Main action handler
  const handleAction = () => {
    try {
      const result = processInput(input);
      setInput(result);
      showToast("Success", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // Keyboard shortcuts
  useHotkeys("Enter", handleAction, { meta: true });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tool Name</h1>
        <div className={styles.actions}>
          <ShareButton />
          {/* Action buttons */}
        </div>
      </header>

      {/* AI Assist Section - consistent styling */}
      <div className={styles.aiSection}>
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Ask AI for help..."
          className={styles.aiInput}
        />
        <AiAssistButton
          prompt={`Context: ${input}. Task: "${aiPrompt}"`}
          systemPrompt="You are an expert assistant for this tool..."
          onResult={handleAiResult}
          disabled={!aiPrompt.trim()}
        />
      </div>

      {/* Tool content */}
      <div className={styles.content}>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="javascript"
          placeholder="Enter input..."
        />
      </div>
    </div>
  );
}
```

## State Management Patterns

### URL State Persistence

```javascript
// Use for state that should persist in URL/shareable links
const [value, setValue] = useUrlState("key", "defaultValue");
```

### Context Providers

```javascript
// Theme management
const { theme, toggleTheme } = useTheme();

// Favorites and recent tools
const { favorites, recentTools, toggleFavorite, addRecent } = useFavorites();

// Toast notifications
const { showToast } = useToast();
```

## Error Handling

### Try-Catch Pattern

```javascript
const handleAction = () => {
  try {
    const result = riskyOperation();
    setResult(result);
    showToast("Success", "success");
  } catch (error) {
    setError(error.message);
    showToast("Operation failed", "error");
  }
};
```

### Validation Pattern

```javascript
const validateInput = (input) => {
  if (!input.trim()) {
    showToast("Please enter some input", "error");
    return false;
  }
  return true;
};
```

## CSS and Styling

### CSS Variables

```css
:root {
  --bg-primary: #050505;
  --bg-secondary: #0f0f0f;
  --accent-primary: #3b82f6;
  --text-primary: #ededed;
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
}

[data-theme="light"] {
  --bg-primary: #f8fafc;
  --text-primary: #0f172a;
}
```

### CSS Modules Pattern

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}
```

## Testing Guidelines

### Test Structure

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Component from "../path/to/component";

// Mock hooks and providers
vi.mock("@/hooks/useUrlState", () => ({
  useUrlState: (key, defaultValue) => {
    const [val, setVal] = require("react").useState(defaultValue);
    return [val, setVal];
  },
}));

vi.mock("@/components/Toast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe("Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<Component />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("handles user interaction", () => {
    render(<Component />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
```

### Test File Location

- Component tests: `src/test/components/[component].test.jsx`
- Hook tests: `src/test/hooks/[hook].test.jsx`
- Tool tests: `src/test/[tool-name].test.jsx`
- Util tests: `src/test/utils/[util].test.js`

## Tool Registry

When adding new tools, update `src/config/tools.js`:

```javascript
{
    id: 'tool-name',           // URL-friendly identifier
    title: 'Tool Title',       // Display name
    description: 'Brief description of what this tool does.',
    icon: IconComponent,       // Lucide React icon
    href: '/tools/tool-name'   // Route path
}
```

## Performance Guidelines

### Memoization

```javascript
import { useMemo, useCallback } from "react";

// Expensive computations
const result = useMemo(() => {
  return computeResult(data);
}, [data]);

// Stable function references
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### Code Splitting

```javascript
// Dynamic imports for heavy libraries
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```

## Accessibility

### Semantic HTML

- Use proper heading hierarchy (`h1`, `h2`, etc.)
- Provide ARIA labels for interactive elements
- Ensure keyboard navigation support

### Focus Management

```javascript
<button
  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
  onClick={handleClick}
  className={styles.button}
>
  <Icon />
</button>
```

## Linting and Formatting

- ESLint uses Next.js core-web-vitals configuration
- Prettier is available for formatting (configured in package.json)
- No TypeScript - project uses JavaScript with jsconfig.json for path mapping

## Path Aliases

```javascript
// Use @ alias for all internal imports
import Component from "@/components/common/Component";
import { hook } from "@/hooks/useHook";
import { util } from "@/utils/util";
import { config } from "@/config/tools";
```

## AI Integration Pattern

All tools should include AI assistance following this pattern:

```javascript
const [aiPrompt, setAiPrompt] = useState("");

const handleAiResult = (response) => {
  // Process and validate AI response
  const processed = processAiResponse(response);
  setInput(processed);
};

// In JSX:
<div className={styles.aiSection}>
  <input
    value={aiPrompt}
    onChange={(e) => setAiPrompt(e.target.value)}
    placeholder="Ask AI for help..."
    className={styles.aiInput}
  />
  <AiAssistButton
    prompt={`Current input: ${input}. User request: "${aiPrompt}"`}
    systemPrompt="You are an expert assistant for [tool purpose]."
    onResult={handleAiResult}
    disabled={!aiPrompt.trim()}
  />
</div>;
```

## Important Notes

- Always use `'use client'` directive for tool pages (interactive components)
- Follow the established component structure and patterns
- Use URL state for data that should be shareable/persisted
- Include AI assistance in all tools using the consistent pattern
- Test thoroughly with Vitest and Testing Library
- Use CSS Modules, not Tailwind or styled-components
- Follow the import order and naming conventions strictly
