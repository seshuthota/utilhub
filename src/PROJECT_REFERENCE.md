# UtilHub Project Reference

**UtilHub** is a high-performance, privacy-focused suite of developer utilities built with Next.js 16. This document serves as a comprehensive reference for all tools, features, and architectural components of the application.

---

## 🚀 Core Application Features

### 1. Persistence & Personalization
- **Favorites & Recent Tools:** Users can "star" tools for quick access. The dashboard automatically tracks recently used tools for seamless workflow continuity.
- **Local Storage Integration:** All preferences (favorites, history, theme) are stored locally in the browser.
- **Unified History System:** A standardized `useHistory` hook and `HistorySidebar` component allow tools to:
  - Save recent inputs/outputs (up to 20 items).
  - Categorize entries (e.g., "Format", "Minify", "AI Generation").
  - Restore previous states with one click.
- **URL State Persistence:** Tool inputs and configurations are automatically synced to the URL query parameters via the `useUrlState` hook. This allows for Deep Linking and state persistence across refreshes.

### 2. User Interface & Experience
- **Dark/Light Mode:** Full support for system-preferred or manual theme switching.
- **Command Palette (`Cmd/Ctrl + K`):** A global search interface to quickly find tools.
  - **Smart Detection:** Automatically detects JWTs, SQL, Timestamps, JSON, Base64, and URLs from the search query and suggests relevant tools.
- **Privacy Badges:** Every tool displays clear indicators:
  - 🔒 **Client-Side Only:** No data leaves your browser.
  - ✨ **AI-Powered:** Uses Groq API for advanced features (requires user opt-in).
- **Keyboard Shortcuts:**
  - **Global:** `Cmd/Ctrl + K` (Palette), `Shift + ?` (Help Modal).
  - **Editor Tools:** `Cmd/Ctrl + Enter` (Run/Format), `Cmd/Ctrl + Shift + C` (Copy), `Cmd/Ctrl + Shift + X` (Clear).
  - **Tool Specific:** `Cmd/Ctrl + Shift + M` (Minify in JSON/XML).
- **Tool Chaining:** Output toolbars feature a "Send to..." menu, allowing users to pass results directly to compatible tools (e.g., JSON output to Base64 Encoder).
- **Responsive Design:** Optimized for mobile, tablet, and desktop viewing with fluid layouts.

### 3. Progressive Web App (PWA)
- **Offline Support:** Service workers ensure the application remains functional even without an internet connection.
- **Installable:** Can be installed as a standalone app on desktop and mobile devices.

### 4. Performance & Security
- **Web Workers:** Computationally heavy tasks (JSON formatting, Diffing, Hashing) run in background threads to prevent UI freezing.
- **Lazy Loading:** Language syntax highlighters and heavy libraries (like Prettier) are loaded on-demand to minimize initial bundle size.
- **Error Boundaries:** Graceful handling of component-level crashes.
- **Client-Side Processing:** Standard processing happens entirely in the browser. AI features use a secure server-side implementation but require user acknowledgement via the **AI Disclaimer** system.

---

## 🛠️ Tool Registry

UtilHub features **41 professional tools** categorized for easy discovery:

### 📄 Formatting & Validation
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `json` | **JSON Formatter** | Format, validate, and minify JSON. | AI JSON repair, Minification, History. |
| `sql` | **SQL Formatter** | Beautify messy SQL queries. | Multiple dialects, Format on Enter. |
| `xml` | **XML Formatter** | Format, minify, and validate XML data. | Minification, Error highlighting. |
| `beautify` | **Code Beautifier** | Beautify or minify HTML, CSS, and JS. | Multi-language support (Prettier). |
| `css-lint` | **CSS Linter** | Check CSS for errors and best practices.| Real-time linting, Accessibility checks. |
| `html-lint` | **HTML Validator** | Validate HTML and accessibility. | W3C standard compliance checks. |
| `json-schema`| **JSON Schema** | Validate JSON against schemas. | Schema-based validation reports. |
| `validate` | **Email/URL Validator**| Validate email addresses and URLs. | Bulk validation support. |
| `yaml-validator`| **K8s/YAML Validator** | Validate syntax and K8s manifests. | Kubernetes schema awareness. |

### 🔄 Converters & Parsers
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `base64` | **Base64 Converter** | Encode/decode text or data to Base64. | File-to-Base64 support. |
| `timestamp` | **Timestamp Converter**| Unix timestamps to human-readable. | Millisecond support, Relative time. |
| `yaml` | **YAML Converter** | Convert between YAML and JSON. | Bidirectional conversion. |
| `csv` | **CSV Viewer** | Parse CSV to table and export JSON. | Table view, Export formats. |
| `url` | **URL Encoder** | Encode and decode URL components. | Standard & Component encoding. |
| `color` | **Color Converter** | Convert Hex, RGB, HSL, and CMYK. | Color picker, format palette. |
| `jwt` | **JWT Decoder** | Decode and inspect JSON Web Tokens. | Header, Payload, and Signature view. |
| `json-to-ts` | **JSON to TypeScript** | Generate TS interfaces from JSON. | Auto-interface generation. |
| `number-base`| **Number Base Conv** | Convert between Binary/Oct/Dec/Hex. | Simultaneous conversion, BigInt support. |
| `units` | **Unit Converter** | Convert bytes, CSS units, and time. | px/em/rem, KB/MB/GB, Seconds/Mins. |
| `graphql-schema`| **GraphQL Schema Tool** | SDL to TS or Introspection JSON. | Type generation, validation. |
| `config-converter`| **Config Converter** | Convert JSON ↔ YAML ↔ TOML. | Multi-format support. |
| `curl` | **Curl Converter** | cURL to various programming languages. | Python, JS, Go, Rust support. |

### 🎨 Design & Visualization
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `markdown` | **Markdown Viewer** | Real-time markdown editor and preview. | Github-flavored MD support. |
| `mermaid` | **Mermaid Chart** | Generate diagrams from text. | AI-powered diagram generation. |
| `diff` | **Diff Checker** | Side-by-side text comparison. | Inline and Side-by-side modes. |
| `image` | **Image Resizer** | Resize, compress, and convert images. | Local WebP/PNG/JPG conversion. |
| `qrcode` | **QR Code Tool** | Generate or scan QR codes instantly. | Camera scanning, SVG generation. |
| `svg-optimizer`| **SVG Optimizer** | Minify SVG files using SVGO. | Plugin toggles, size reduction stats. |
| `favicon-generator`| **Favicon Gen** | Generate full favicon packages. | Multi-size ICO, Apple touch icons. |

### 🔍 Search, Security & DevOps
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `regex` | **Regex Tester** | Test regular expressions with matching. | Live match highlighting, flag support. |
| `hash` | **Hash Generator** | Calculate MD5, SHA-1, SHA-256 hashes. | Bulk string hashing, Worker support. |
| `password` | **Password Audit** | Check strength and crack times. | zxcvbn based scoring, entropy stats. |
| `ip-subnet` | **IP Subnet Calc** | Network masks and IP range calcs. | CIDR notation, Host range table. |
| `chmod` | **Chmod Calculator** | Visual Unix permissions calculator. | Octal/Symbolic modes, explanation text. |
| `docker-converter`| **Docker Run -> Compose** | `docker run` to `docker-compose.yml`. | Port, volume, and env var mapping. |

### 📦 Utilities & Workflows
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `api-tester` | **API Tester** | Full HTTP client for testing APIs. | **cURL Import**, **Environment Vars**. |
| `uuid` | **UUID Generator** | Generate random UUID v4 identifiers. | Bulk generation support. |
| `lorem` | **Lorem Ipsum** | Generate dummy text placeholders. | Paragraph/Word counts. |
| `case-converter`| **Text Case Conv** | camelCase, snake_case, kebab-case. | TitleCase, SentenceCase support. |
| `pipeline` | **Pipeline Builder** | Chain tools for custom workflows. | Async execution, URL-shareable. |

---

## 🤖 Advanced Capabilities

### 1. Tool Pipelines
The **Pipeline Builder** allows users to chain multiple tools sequentially.
- **Workflow Engine:** Asynchronous execution with progress reporting.
- **Auto-Conversion:** Automatically handles type matching between tool steps.
- **Persistence:** Save custom pipelines to local storage or share them via compressed URLs.

### 2. AI Integration
Powered by Groq APIs with user-controlled activation.
- **JSON Repair:** AI can fix common JSON errors (missing commas, trailing commas, unquoted keys).
- **Diagram Generation:** Generate Mermaid charts from natural language descriptions.
- **Complex Patterning:** Generate RegEx for complex scenarios.
- **Natural Language Cron:** Describe schedules to generate cron expressions.

### 3. API Tester: Pro Features
- **cURL Command Importing:** Paste a complete `curl` command to automatically populate the method, URL, headers, and body.
- **Environment Variables:** Define variables in the `{{variableName}}` format with support for multiple environments.

### 4. Custom Component Library
- **`CodeEditor`:** Lightweight editor with lazy-loaded syntax highlighting (Prism.js).
- **`ActionToolbar`:** Intelligent toolbar providing copy feedback and dynamic tool suggestions.
- **`AiDisclaimer`:** Legal/privacy transparency modal for AI data transmission.

---

## 💻 Tech Stack

- **Framework:** Next.js 16 (App Router).
- **Styling:** Vanilla CSS Modules with standardized design tokens.
- **Icons:** Lucide React.
- **Core Libraries:** `svgo`, `graphql`, `papaparse`, `js-yaml`, `mermaid`, `zxcvbn`, `crypto-js`.
- **Testing:** Vitest & React Testing Library (71%+ coverage).
- **Workers:** Custom Web Worker wrapper for non-blocking UI.
