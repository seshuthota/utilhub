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
- **Command Palette (`Cmd/Ctrl + K`):** A global search interface to quickly find and navigate between tools.
- **Keyboard Shortcuts:**
  - **Global:** `Cmd/Ctrl + K` (Palette), `Shift + ?` (Help Modal).
  - **Editor Tools:** `Cmd/Ctrl + Enter` (Run/Format), `Cmd/Ctrl + Shift + C` (Copy), `Cmd/Ctrl + Shift + X` (Clear).
  - **Tool Specific:** `Cmd/Ctrl + Shift + M` (Minify in JSON/XML).
- **Toast Notifications:** Real-time feedback for actions like copying to clipboard, errors, or successful formatting.
- **Responsive Design:** Optimized for mobile, tablet, and desktop viewing with fluid layouts.

### 3. Progressive Web App (PWA)
- **Offline Support:** Service workers ensure the application remains functional even without an internet connection.
- **Installable:** Can be installed as a standalone app on desktop and mobile devices.

### 4. Robustness
- **Error Boundaries:** Graceful handling of component-level crashes to prevent the entire app from failing.
- **Client-Side Processing:** All data processing (parsing, formatting, conversion) happens entirely in the user's browser, ensuring maximum privacy. No user data (passwords, JWTs, JSON) is ever sent to a server for processing.

---

## 🛠️ Tool Registry

UtilHub features **34 professional tools** categorized for easy discovery:

### 📄 Formatting & Validation
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `json` | **JSON Formatter** | Format, validate, and minify JSON. | AI JSON repair, Minification, History. |
| `sql` | **SQL Formatter** | Beautify messy SQL queries. | Multiple dialects, Format on Enter. |
| `xml` | **XML Formatter** | Format, minify, and validate XML data. | Minification, Error highlighting. |
| `beautify` | **Code Beautifier** | Beautify or minify HTML, CSS, and JS. | Multi-language support. |
| `css-lint` | **CSS Linter** | Check CSS for errors and best practices.| Real-time linting, Accessibility checks. |
| `html-lint` | **HTML Validator** | Validate HTML and accessibility. | W3C standard compliance checks. |
| `json-schema`| **JSON Schema** | Validate JSON against schemas. | Schema-based validation reports. |
| `validate` | **Email/URL Validator**| Validate email addresses and URLs. | Bulk validation support. |

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
| `number-base`| **Number Base Conv** | Convert between Binary/Oct/Dec/Hex. | Simultaneous conversion. |
| `units` | **Unit Converter** | Convert bytes, CSS units, and time. | px/em/rem, KB/MB/GB, Seconds/Mins. |

### 🎨 Design & Visualization
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `markdown` | **Markdown Viewer** | Real-time markdown editor and preview. | Github-flavored MD support. |
| `mermaid` | **Mermaid Chart** | Generate diagrams from text. | Flowcharts, Sequence, Gantt charts. |
| `diff` | **Diff Checker** | Side-by-side text comparison. | Inline and Side-by-side modes. |
| `image` | **Image Resizer** | Resize, compress, and convert images. | Local WebP/PNG/JPG conversion. |
| `qrcode` | **QR Code Tool** | Generate or scan QR codes instantly. | Camera scanning, SVG generation. |

### 🔍 Search & Security
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `regex` | **Regex Tester** | Test regular expressions with matching. | Live match highlighting, flag support. |
| `hash` | **Hash Generator** | Calculate MD5, SHA-1, SHA-256 hashes. | Bulk string hashing. |
| `password` | **Password Audit** | Check strength and crack times. | zxcvbn based scoring, entropy stats. |
| `ip-subnet` | **IP Subnet Calc** | Network masks and IP range calcs. | CIDR notation, Host range table. |
| `chmod` | **Chmod Calculator** | Visual Unix permissions calculator. | Octal/Symbolic modes. |

### 🤖 AI-Powered Tools
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `regex-generator`| **RegEx Generator** | Generate regex using AI prompts. | Complex pattern generation. |
| `cron` | **Cron Parser** | Visualize and describe cron schedules. | AI "Describe schedule" feature. |

### 📦 Utilities
| Tool ID | Name | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `api-tester` | **API Tester** | Full HTTP client for testing APIs. | **cURL Import**, **Environment Vars**. |
| `uuid` | **UUID Generator** | Generate random UUID v4 identifiers. | Bulk generation support. |
| `lorem` | **Lorem Ipsum** | Generate dummy text placeholders. | Paragraph/Word counts. |
| `case-converter`| **Text Case Conv** | camelCase, snake_case, kebab-case. | TitleCase, SentenceCase support. |

---

## 🤖 Advanced Capabilities

### 1. AI Integration
Powered by Groq APIs with a secure server-side implementation.
- **JSON Repair:** AI can fix common JSON errors (missing commas, trailing commas, unquoted keys).
- **Data Generation:** "Generate 5 sample user objects" directly into the JSON tool.
- **Complex Patterning:** Generate RegEx for complex scenarios like "Validate a Swiss phone number".
- **Natural Language Cron:** Describe what you want the cron to do, and the AI generates the expression.

### 2. API Tester: Pro Features
- **cURL Command Importing:** Paste a complete `curl` command to automatically populate the method, URL, headers, body, and authentication (Basic/Bearer).
- **Environment Variables:** Define variables in the `{{variableName}}` format. Support for multiple environments (Dev, Staging, Prod) with local storage persistence.
- **Authorization Support:** Integrated handling for Basic Auth and Bearer Tokens.

### 3. Custom Component Library
- **`CodeEditor`:** A custom-built editor with syntax highlighting (Prism.js), line numbers, and "Copy/Clear" actions.
- **`HistorySidebar`:** A slide-out panel that persists across sessions and provides a deep history of tool usage.
- **`ShareButton`:** One-click generation of shareable URLs containing the current tool state encoded in the query parameters.

---

## 💻 Tech Stack

- **Framework:** Next.js 16 (App Router, Client-Side focus).
- **Styling:** Vanilla CSS Modules.
- **Icons:** Lucide React.
- **Syntax Highlighting:** Prism.js & `@babel/standalone`.
- **Parsing/Utilities:** `js-yaml`, `marked`, `mermaid`, `prettier`, `sql-formatter`, `xml-formatter`.
- **Security:** `zxcvbn` (Password strength), `crypto-js` (Hashing).
- **Testing:** Vitest & React Testing Library.
