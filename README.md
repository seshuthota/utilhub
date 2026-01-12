# UtilHub

A comprehensive suite of **28+ developer utilities** built with Next.js. All tools run client-side for privacy and speed.

🔗 **Live Demo:** [utilhub-eta.vercel.app](https://utilhub-eta.vercel.app)

## ✨ Features

- 🌓 **Dark/Light Mode** - Toggle with persistence
- 📱 **PWA Ready** - Installable on mobile/desktop
- ⚡ **100% Client-Side** - No server processing, your data stays private
- 🎨 **Monochrome Design** - Clean, distraction-free UI

## 🛠️ Tools (28+)

| Category | Tools |
|----------|-------|
| **Text & Code** | Markdown Viewer, JSON Formatter, XML Formatter, SQL Formatter, Code Beautifier |
| **Data Formats** | YAML Converter, CSV Viewer, Base64 Encoder |
| **Diagrams** | Mermaid Chart Renderer |
| **Comparison** | Diff Checker |
| **Converters** | URL Encoder, Timestamp Converter, Unit Converter |
| **Security** | Hash Generator, Password Strength Checker, JWT Decoder |
| **Validators** | JSON Schema Validator, Email/URL Validator, CSS Linter, HTML Validator |
| **Utilities** | Regex Tester, Lorem Ipsum Generator, Cron Parser, Color Picker |
| **Media** | Image Resizer, QR Code Generator/Scanner |
| **API** | API Tester (Postman-like) |

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/seshuthota/utilhub.git
cd utilhub

# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Test
npm test
```

Open [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
npm test        # Run tests
npm run test    # Watch mode
```

- **Vitest** + **React Testing Library**
- 26 tests covering utility logic and components

## 📦 Tech Stack

- **Framework:** Next.js 16
- **Styling:** CSS Modules (Vanilla CSS)
- **Icons:** Lucide React
- **Testing:** Vitest, React Testing Library

## 🏗️ Project Structure

```
src/
├── app/
│   ├── tools/           # All tool pages
│   │   ├── markdown/
│   │   ├── json/
│   │   ├── yaml/
│   │   └── ...
│   ├── layout.js
│   └── page.jsx         # Dashboard
├── components/
│   ├── common/          # Reusable components
│   ├── layout/          # Sidebar, Layout
│   ├── ThemeProvider.jsx
│   └── ThemeToggle.jsx
└── test/                # Test files
```

## 📄 License

MIT

---

Built with ☕ by [@seshuthota](https://github.com/seshuthota)
