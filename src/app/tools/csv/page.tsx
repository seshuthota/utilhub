"use client";

import { useState, useEffect } from "react";
// @ts-ignore
import Papa from "papaparse";
// @ts-ignore
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-csv";
import { Table, FileJson, Download, Trash2, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

export default function CsvTool() {
    const [input, setInput] = useState(
        "name,role,location\nAlice,Admin,NY\nBob,User,SF\nCharlie,Guest,London",
    );
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    function parseCsv(val: string) {
        if (!val.trim()) {
            setData([]);
            setHeaders([]);
            return;
        }

        Papa.parse(val, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                if (results.errors.length > 0) {
                    setError(results.errors[0].message);
                } else {
                    setError(null);
                    setData(results.data);
                    if (results.meta.fields) {
                        setHeaders(results.meta.fields);
                    } else if (results.data.length > 0) {
                        setHeaders(Object.keys(results.data[0]));
                    }
                }
            },
            error: (err: Error) => {
                setError(err.message);
            },
        });
    }

    // Auto-parse
    useEffect(() => {
        const timer = setTimeout(() => {
            parseCsv(input);
        }, 0);
        return () => clearTimeout(timer);
    }, [input]);

    const downloadJson = () => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "data.json";
        link.click();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>CSV Viewer</h1>
                <div className={styles.actions}>
                    <button
                        className={styles.button}
                        onClick={downloadJson}
                        title="Export JSON"
                        disabled={data.length === 0}
                    >
                        <FileJson size={16} /> Export JSON
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => setInput("")}
                        title="Clear"
                    >
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className={styles.split}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>CSV Input</div>
                    <div className={styles.editor}>
                        <Editor
                            value={input}
                            onValueChange={(val: string) => {
                                setInput(val);
                                parseCsv(val);
                            }}
                            highlight={(code: string) =>
                                Prism.highlight(
                                    code,
                                    Prism.languages.csv || Prism.languages.text,
                                    "csv",
                                )
                            }
                            padding={20}
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 14,
                                backgroundColor: "transparent",
                                minHeight: "100%",
                            }}
                            textareaClassName="focus:outline-none"
                        />
                    </div>
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        Table Preview ({data.length} rows)
                    </div>
                    <div className={styles.preview}>
                        {data.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {headers.map((h, i) => (
                                            <th key={i}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, i) => (
                                        <tr key={i}>
                                            {headers.map((h, j) => (
                                                <td key={j}>{row[h]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>
                                <Table size={48} />
                                <p>Enter CSV data to view table</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
