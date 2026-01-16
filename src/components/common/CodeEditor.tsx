'use client';

import { useState, useCallback, ReactNode, CSSProperties, KeyboardEvent } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import styles from "./CodeEditor.module.css";

// Helper type for dynamic imports
type LoaderFn = () => Promise<any>;

const LANGUAGE_MODULES: Record<string, LoaderFn> = {
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
    bash: () => import("prismjs/components/prism-bash"),
};

const loadedLanguages = new Set<string>(["plaintext"]);

interface LanguageLoaderProps {
    language: string;
    children: ReactNode;
}

const LanguageLoader = ({ language, children }: LanguageLoaderProps) => {
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
                // Even if failed, we set loaded to true to show plain text
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

    return <>{children}</>;
};

interface CodeEditorProps {
    value: string;
    onChange?: (value: string) => void;
    language?: string;
    placeholder?: string;
    readOnly?: boolean;
    onRun?: () => void;
    className?: string;
    style?: CSSProperties;
}

/**
 * A lightweight code editor with syntax highlighting using PrismJS.
 * Supports lazy loading of languages.
 */
export default function CodeEditor({
    value,
    onChange = () => { },
    language = "plaintext",
    placeholder,
    readOnly = false,
    onRun,
    className = '',
    style = {},
}: CodeEditorProps) {
    const highlight = useCallback(
        (code: string) => {
            if (!language || !Prism.languages[language]) {
                return code;
            }
            return Prism.highlight(code, Prism.languages[language], language);
        },
        [language],
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            if (onRun) {
                e.preventDefault();
                onRun();
            }
        }
    };

    return (
        <div className={`${styles.container} ${className}`} style={style} onKeyDown={handleKeyDown}>
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

/**
 * Preloads a syntax highlighting language.
 */
export function preloadLanguage(language: string) {
    const loadFn = LANGUAGE_MODULES[language];
    if (loadFn && !loadedLanguages.has(language)) {
        loadFn().then(() => {
            loadedLanguages.add(language);
        });
    }
}

/**
 * Returns a list of all supported languages.
 */
export function getAvailableLanguages(): string[] {
    return Object.keys(LANGUAGE_MODULES);
}
