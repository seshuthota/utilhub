"use client";

import { useState, useCallback, useMemo } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import {
  Wand2,
  Copy,
  Trash2,
  Minimize2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useInputSize, getProcessingEstimate } from "@/hooks/useInputSize";
import styles from "./page.module.css";

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", parser: "babel" },
  { id: "typescript", name: "TypeScript", parser: "babel-ts" },
  { id: "html", name: "HTML", parser: "html" },
  { id: "css", name: "CSS", parser: "css" },
  { id: "json", name: "JSON", parser: "json" },
  { id: "markdown", name: "Markdown", parser: "markdown" },
  { id: "yaml", name: "YAML", parser: "yaml" },
  { id: "xml", name: "XML", parser: "xml" },
  { id: "sql", name: "SQL", parser: "sql" },
];

const PLUGIN_MAP = {
  javascript: () => import("prettier/plugins/babel"),
  typescript: () => import("prettier/plugins/babel"),
  json: () => import("prettier/plugins/babel"),
  html: () => import("prettier/plugins/html"),
  css: () => import("prettier/plugins/postcss"),
  yaml: () => import("prettier/plugins/yaml"),
  markdown: () => import("prettier/plugins/markdown"),
};

let loadedPlugins = null;
let prettierInstance = null;

async function getPrettier() {
  if (prettierInstance) return prettierInstance;

  const prettier = await import("prettier/standalone");
  prettierInstance = prettier;
  return prettier;
}

async function getPlugins(language) {
  const pluginFn = PLUGIN_MAP[language];
  if (!pluginFn) return [];

  const key = language;
  if (loadedPlugins && loadedPlugins[key]) {
    return loadedPlugins[key];
  }

  const plugin = await pluginFn();
  if (!loadedPlugins) loadedPlugins = {};
  loadedPlugins[key] = [plugin];
  return loadedPlugins[key];
}

async function loadSqlFormatter() {
  const { format } = await import("sql-formatter");
  return format;
}

async function loadXmlFormatter() {
  const xmlFormatter = await import("xml-formatter");
  return xmlFormatter.default || xmlFormatter;
}

export default function BeautifyTool() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const inputSize = useInputSize({
    warningThreshold: 1024 * 200,
    heavyThreshold: 1024 * 500,
    criticalThreshold: 1024 * 1024,
    maxSize: 5 * 1024 * 1024,
  });

  const handleBeautify = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      inputSize.startProcessing();

      if (!code.trim()) {
        setIsLoading(false);
        return;
      }

      let formatted;

      if (language === "sql") {
        const formatSql = await loadSqlFormatter();
        formatted = formatSql(code);
      } else if (language === "xml") {
        const xmlFormatter = await loadXmlFormatter();
        formatted = xmlFormatter(code, {
          indentation: "  ",
          collapseContent: true,
          lineSeparator: "\n",
        });
      } else {
        const prettier = await getPrettier();
        const plugins = await getPlugins(language);
        formatted = await prettier.format(code, {
          parser: LANGUAGES.find((l) => l.id === language)?.parser,
          plugins,
          printWidth: 80,
          tabWidth: 2,
          semi: true,
          singleQuote: true,
        });
      }

      setCode(formatted);
      showToast("Code beautified successfully", "success");
    } catch (e) {
      console.error(e);
      setError(e.message);
      showToast("Formatting failed", "error");
    } finally {
      setIsLoading(false);
      inputSize.finishProcessing();
    }
  }, [code, language, showToast, inputSize]);

  const handleMinify = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      inputSize.startProcessing();

      if (!code.trim()) {
        setIsLoading(false);
        return;
      }

      let minified;

      if (language === "json") {
        minified = JSON.stringify(JSON.parse(code));
      } else if (language === "xml") {
        const xmlFormatter = await loadXmlFormatter();
        minified = xmlFormatter(code, { indentation: "", lineSeparator: "" });
      } else if (language === "sql") {
        minified = code.replace(/\s+/g, " ").trim();
      } else {
        minified = code.replace(/\s+/g, " ").trim();
        showToast("Basic minification applied", "info");
      }

      if (minified) {
        setCode(minified);
        showToast("Minified successfully", "success");
      }
    } catch (e) {
      setError(e.message);
      showToast("Minification failed", "error");
    } finally {
      setIsLoading(false);
      inputSize.finishProcessing();
    }
  }, [code, language, showToast, inputSize]);

  const getPrismLang = useCallback((lang) => {
    switch (lang) {
      case "html":
      case "xml":
        return Prism.languages.markup;
      case "css":
        return Prism.languages.css;
      case "javascript":
        return Prism.languages.javascript;
      case "typescript":
        return Prism.languages.typescript || Prism.languages.javascript;
      case "json":
        return Prism.languages.json;
      case "sql":
        return Prism.languages.sql;
      case "yaml":
        return Prism.languages.yaml;
      case "markdown":
        return Prism.languages.markdown;
      default:
        return Prism.languages.javascript;
    }
  }, []);

  const highlight = useCallback(
    (codeStr) => {
      const lang = Prism.languages[language] || getPrismLang(language);
      if (!lang) return codeStr;
      return Prism.highlight(codeStr, lang, language);
    },
    [language, getPrismLang],
  );

  const SizeWarning = useMemo(() => {
    if (inputSize.status === "idle" || inputSize.status === "normal")
      return null;

    const warningStyles = {
      warning: {
        background: "var(--warning-bg)",
        color: "var(--warning-color)",
        border: "1px solid var(--warning-color)",
      },
      heavy: {
        background: "rgba(255, 165, 0, 0.15)",
        color: "orange",
        border: "1px solid orange",
      },
      critical: {
        background: "var(--error-bg)",
        color: "var(--error-color)",
        border: "1px solid var(--error-color)",
      },
    };

    const style = warningStyles[inputSize.status] || warningStyles.warning;
    const messages = {
      warning: "Large code - loading formatters on demand",
      heavy: "Very large code - processing may take a moment",
      critical: "Code size exceeds recommended limit",
    };

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem",
          borderRadius: "8px",
          fontSize: "0.85rem",
          marginBottom: "1rem",
          ...style,
        }}
      >
        <AlertCircle size={16} />
        <span>{messages[inputSize.status]}</span>
        {inputSize.estimatedTime && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              marginLeft: "auto",
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            Est. {inputSize.estimatedTime}
          </span>
        )}
      </div>
    );
  }, [inputSize]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Code Beautifier</h1>
        <div className={styles.actions}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={styles.select}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            className={styles.button}
            onClick={handleBeautify}
            disabled={isLoading}
          >
            <Wand2 size={16} /> Beautify
          </button>
          <button
            className={styles.button}
            onClick={handleMinify}
            disabled={isLoading}
          >
            <Minimize2 size={16} /> Minify
          </button>
          <button
            className={styles.button}
            onClick={() => {
              navigator.clipboard.writeText(code);
              showToast("Copied to clipboard", "success");
            }}
          >
            <Copy size={16} /> Copy
          </button>
          <button className={styles.button} onClick={() => setCode("")}>
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </header>

      {SizeWarning}

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.editorWrapper}>
        <Editor
          value={code}
          onValueChange={(val) => {
            setCode(val);
            inputSize.setInput(val);
          }}
          highlight={highlight}
          padding={20}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            backgroundColor: "transparent",
            minHeight: "100%",
          }}
          textareaClassName={styles.textarea}
          placeholder={`Paste your ${language} code here...`}
        />
      </div>
    </div>
  );
}
