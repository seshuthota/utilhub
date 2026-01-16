'use client';

import { useState, useEffect } from "react";
import * as curlconverter from "curlconverter";
import { Trash2, Copy } from "lucide-react";
import CodeEditor from "@/components/common/CodeEditor";
import { useToast } from "@/components/Toast";
import { useUrlState } from "@/hooks/useUrlState";
import styles from "./page.module.css";

interface LanguageConfig {
    id: string;
    name: string;
    mode: string;
    fn: keyof typeof curlconverter;
}

const LANGUAGES: LanguageConfig[] = [
    { id: "python", name: "Python (requests)", mode: "python", fn: "toPython" },
    { id: "javascript", name: "Node.js (fetch)", mode: "javascript", fn: "toNodeFetch" },
    { id: "node-axios", name: "Node.js (Axios)", mode: "javascript", fn: "toNodeAxios" },
    { id: "go", name: "Go", mode: "go", fn: "toGo" },
    { id: "rust", name: "Rust", mode: "rust", fn: "toRust" },
    { id: "php", name: "PHP", mode: "php", fn: "toPhp" },
    { id: "java", name: "Java", mode: "java", fn: "toJava" },
    { id: "dart", name: "Dart", mode: "dart", fn: "toDart" },
    { id: "elixir", name: "Elixir", mode: "elixir", fn: "toElixir" },
    { id: "ansible", name: "Ansible", mode: "yaml", fn: "toAnsible" },
    { id: "json", name: "JSON", mode: "json", fn: "toJsonString" },
];

export default function Converter() {
    const [input, setInput] = useUrlState("curl", "");
    const [output, setOutput] = useState("");
    const [language, setLanguage] = useUrlState("lang", "python");
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleConvert = (curl: string, langId: string) => {
        if (!curl.trim()) {
            setOutput("");
            setError(null);
            return;
        }

        try {
            const langConfig = LANGUAGES.find((l) => l.id === langId);
            if (!langConfig) throw new Error("Language not supported");

            const convertFn = curlconverter[langConfig.fn];
            if (!convertFn) {
                // Fallback or generic error if function misses (shouldn't happen with correct version)
                throw new Error(`Conversion function for ${langConfig.name} not found`);
            }

            // curlconverter types might need assertion if explicit types are missing
            const result = (convertFn as Function)(curl);
            setOutput(result);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("Invalid cURL command or parsing failed. " + err.message);
            setOutput("");
        }
    };

    useEffect(() => {
        handleConvert(input, language);
    }, [input, language]);

    const copyToClipboard = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        showToast("Code copied to clipboard", "success");
    };

    const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={styles.select}
                    aria-label="Target Language"
                >
                    {LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                            {lang.name}
                        </option>
                    ))}
                </select>

                <button
                    className="btn btn-secondary"
                    onClick={() => setInput("")}
                    disabled={!input}
                    title="Clear Input"
                >
                    <Trash2 size={16} /> Clear
                </button>
            </div>

            <div className={styles.editors}>
                {/* Input Column */}
                <div className={styles.column}>
                    <span className={styles.label}>cURL Command</span>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language="bash"
                            placeholder="curl https://api.example.com/data -H 'Authorization: Bearer token'"
                            className="h-full"
                        />
                    </div>
                </div>

                {/* Output Column */}
                <div className={styles.column}>
                    <div className="flex justify-between items-center">
                        <span className={styles.label}>{currentLang.name} Output</span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={copyToClipboard}
                            disabled={!output}
                            title="Copy Output"
                        >
                            <Copy size={14} />
                        </button>
                    </div>

                    <div className={styles.editorWrapper} style={{ borderColor: error ? 'var(--error-color)' : '' }}>
                        {error ? (
                            <div className="p-4 text-red-500 font-mono text-sm break-all">
                                {error}
                            </div>
                        ) : (
                            <CodeEditor
                                value={output}
                                onChange={() => { }} // Read only
                                language={currentLang.mode}
                                readOnly={true}
                                className="h-full"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
