"use client";

import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import styles from "./CodeEditor.module.css";

const LANGUAGE_MODULES = {
  json: () => import("prismjs/components/prism-json"),
  sql: () => import("prismjs/components/prism-sql"),
  yaml: () => import("prismjs/components/prism-yaml"),
  markdown: () => import("prismjs/components/prism-markdown"),
  javascript: () => import("prismjs/components/prism-javascript"),
  typescript: () => import("prismjs/components/prism-typescript"),
  css: () => import("prismjs/components/prism-css"),
  markup: () => import("prismjs/components/prism-markup"),
  xml: () => import("prismjs/components/prism-markup"),
  html: () => import("prismjs/components/prism-markup"),
  python: () => import("prismjs/components/prism-python"),
  java: () => import("prismjs/components/prism-java"),
  c: () => import("prismjs/components/prism-c"),
  cpp: () => import("prismjs/components/prism-cpp"),
  go: () => import("prismjs/components/prism-go"),
  rust: () => import("prismjs/components/prism-rust"),
  php: () => import("prismjs/components/prism-php"),
  ruby: () => import("prismjs/components/prism-ruby"),
};

const loadedLanguages = new Set(["plaintext"]);

const LanguageLoader = ({ language, children }) => {
  const [loaded, setLoaded] = useState(loadedLanguages.has(language));

  const loadLanguage = useCallback(async () => {
    if (loadedLanguages.has(language)) {
      setLoaded(true);
      return;
    }

    const loadFn = LANGUAGE_MODULES[language];
    if (loadFn) {
      try {
        await loadFn();
        loadedLanguages.add(language);
        setLoaded(true);
      } catch (e) {
        console.error(`Failed to load language: ${language}`, e);
        setLoaded(true);
      }
    } else {
      setLoaded(true);
    }
  }, [language]);

  if (!loaded) {
    loadLanguage();
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        Loading {language} syntax...
      </div>
    );
  }

  return children;
};

export default function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  placeholder,
  readOnly = false,
  onRun,
}) {
  const highlight = useCallback(
    (code) => {
      if (!language || !Prism.languages[language]) {
        return code;
      }
      return Prism.highlight(code, Prism.languages[language], language);
    },
    [language],
  );

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      if (onRun) {
        e.preventDefault();
        onRun();
      }
    }
  };

  return (
    <div className={styles.container} onKeyDown={handleKeyDown}>
      <LanguageLoader language={language}>
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlight}
          padding={20}
          placeholder={placeholder}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            backgroundColor: "transparent",
            minHeight: "100%",
          }}
          textareaClassName={styles.textarea}
          readOnly={readOnly}
        />
      </LanguageLoader>
    </div>
  );
}

export function preloadLanguage(language) {
  const loadFn = LANGUAGE_MODULES[language];
  if (loadFn && !loadedLanguages.has(language)) {
    loadFn().then(() => {
      loadedLanguages.add(language);
    });
  }
}

export function getAvailableLanguages() {
  return Object.keys(LANGUAGE_MODULES);
}
