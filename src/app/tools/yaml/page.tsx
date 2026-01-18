'use client';

import { useState } from "react";
import yaml from "js-yaml";
import { ArrowLeftRight, Copy, Trash2, Code } from "lucide-react";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import { useToast } from "@/components/Toast";
import styles from "./page.module.css";

type Mode = 'yaml2json' | 'json2yaml';

export default function YamlTool() {
    const [input, setInput] = useState("name: UtilHub\nactive: true");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<Mode>("yaml2json");
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleConvert = () => {
        try {
            setError(null);
            if (mode === "yaml2json") {
                const doc = yaml.load(input);
                setOutput(JSON.stringify(doc, null, 2));
            } else {
                const obj = JSON.parse(input);
                setOutput(yaml.dump(obj));
            }
            showToast("Converted successfully", "success");
        } catch (e: any) {
            setError(e.message);
            showToast("Conversion failed", "error");
        }
    };

    const toYaml = () => {
        setMode("json2yaml");
        setInput(output || '{"name": "UtilHub"}');
        setOutput("");
        setError(null);
    };

    const toJson = () => {
        setMode("yaml2json");
        setInput(output || "name: UtilHub");
        setOutput("");
        setError(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>YAML Converter</h1>
                <div className={styles.actions}>
                    <button
                        className={`${styles.tabBtn} ${mode === "yaml2json" ? styles.active : ""}`}
                        onClick={toJson}
                    >
                        YAML to JSON
                    </button>
                    <button
                        className={`${styles.tabBtn} ${mode === "json2yaml" ? styles.active : ""}`}
                        onClick={toYaml}
                    >
                        JSON to YAML
                    </button>
                </div>
            </header>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <div className={styles.editorContainer}>
                {/* Input Pane */}
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span className={styles.label}>
                            {mode === "yaml2json" ? "YAML Input" : "JSON Input"}
                        </span>
                        <div className={styles.paneActions}>
                            <button
                                className={styles.iconBtn}
                                onClick={handleConvert}
                                title="Convert"
                            >
                                <ArrowLeftRight size={16} /> Convert
                            </button>
                            <button
                                className={styles.iconBtn}
                                onClick={() => setInput("")}
                                title="Clear"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeMirrorEditor
                            value={input}
                            onChange={setInput}
                            language={mode === "yaml2json" ? "yaml" : "json"}
                            placeholder="Paste content here..."
                        />
                    </div>
                </div>

                {/* Output Pane */}
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span className={styles.label}>
                            {mode === "yaml2json" ? "JSON Output" : "YAML Output"}
                        </span>
                        <div className={styles.paneActions}>
                            <button
                                className={styles.iconBtn}
                                onClick={() => {
                                    navigator.clipboard.writeText(output);
                                    showToast("Copied!", "success");
                                }}
                                title="Copy"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeMirrorEditor
                            value={output}
                            onChange={setOutput} // allow editing output
                            language={mode === "yaml2json" ? "json" : "yaml"}
                            readOnly={false}
                            placeholder="Result..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
