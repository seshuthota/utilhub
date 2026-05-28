"use client";

import { useState, useCallback, useEffect } from "react";
import composerize from "composerize";
import { Container, Play } from "lucide-react";
import { useUrlState } from "@/hooks/useUrlState";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import ActionToolbar from "@/components/common/ActionToolbar";
import styles from "./page.module.css";

const EXAMPLE_CMD =
    "docker run -d -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro --name nginx nginx";

export default function DockerConverter() {
    const [input, setInput] = useUrlState("cmd", "");
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const convert = useCallback((cmd: string) => {
        if (!cmd.trim()) {
            setOutput("");
            setError(null);
            return;
        }

        try {
            // composerize throws errors or returns output string
            const yaml = composerize(cmd);
            setOutput(yaml);
            setError(null);
        } catch (e: any) {
            console.error(e);
            setOutput("");
            // Composerize errors can be strings or objects
            setError(e.message || e.toString() || "Invalid docker run command");
        }
    }, []);

    // Auto-convert on input change
    useEffect(() => {
        const timer = setTimeout(() => {
            convert(input);
        }, 0);
        return () => clearTimeout(timer);
    }, [input, convert]);

    const loadExample = () => {
        setInput(EXAMPLE_CMD);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Container size={24} className="text-primary" />
                    <h1 className={styles.title}>Docker Run to Compose</h1>
                </div>
            </header>

            <div className={styles.main}>
                <div className={styles.splitView}>
                    {/* Input Pane */}
                    <div className={styles.pane}>
                        <div className={styles.paneHeader}>
                            <div
                                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                            >
                                <Play size={14} />
                                <span>Docker Run Command</span>
                            </div>
                            <button className={styles.exampleBtn} onClick={loadExample}>
                                Load Example
                            </button>
                        </div>
                        <div className={styles.editorArea}>
                            <CodeMirrorEditor
                                value={input}
                                onChange={setInput}
                                language="bash"
                                placeholder="Paste your docker run command here..."
                            />
                        </div>
                        {error && (
                            <div className={styles.error}>
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                    </div>

                    {/* Output Pane */}
                    <div className={styles.pane}>
                        <div className={styles.paneHeader}>
                            <span>docker-compose.yml</span>
                            <ActionToolbar
                                content={output}
                                currentToolId="docker-converter"
                            />
                        </div>
                        <div className={styles.editorArea}>
                            <CodeMirrorEditor
                                value={output}
                                readOnly={true}
                                language="yaml"
                                placeholder="Combined output will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
