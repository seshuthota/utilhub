'use client';

import { useState, useCallback } from "react";
import {
    Braces,
    Copy,
    Trash2,
    Maximize,
    Minimize,
    History,
    AlertTriangle,
    Clock,
    Loader2,
} from "lucide-react";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import ShareButton from "@/components/common/ShareButton";
import AiAssistBar from "@/components/common/AiAssistBar";
import HistorySidebar from "@/components/common/HistorySidebar";
import ActionToolbar from "@/components/common/ActionToolbar";

import { useUrlState } from "@/hooks/useUrlState";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useHistory } from "@/hooks/useHistory";
import { useInputSize } from "@/hooks/useInputSize";
import { useToast } from "@/components/Toast";
import { parseJsonError } from "@/utils/errorParser";
import { useWorker } from "@/hooks/useWorker";
import jsonWorkerScript from "@/workers/json.worker.js?raw";

import styles from "./page.module.css";

const HISTORY_KEY = "utilhub_json_history";

interface SizeWarningProps {
    inputSize: {
        status: 'idle' | 'normal' | 'warning' | 'heavy' | 'critical';
        estimatedTime?: string;
        isProcessing?: boolean;
    }
}

function SizeWarning({ inputSize }: SizeWarningProps) {
    if (inputSize.status === "idle" || inputSize.status === "normal") return null;

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
        warning: "Large file - using optimized processing",
        heavy: "Very large file - processing may take a few seconds",
        critical: "File size exceeds recommended limit",
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
            <AlertTriangle size={16} />
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
                    <Clock size={14} />
                    Est. time: {inputSize.estimatedTime}
                </span>
            )}
            {inputSize.isProcessing && (
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        marginLeft: "auto",
                    }}
                >
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                </span>
            )}
        </div>
    );
}

interface JsonError {
    message: string;
    line?: number | null;
    col?: number | null;
    suggestion?: string;
}

import JsonGraph from "./JsonGraph";

export default function JsonTool() {
    const [code, setCode] = useUrlState(
        "code",
        '{"name":"UtilHub","type":"Project","active":true}',
    );
    const [view, setView] = useUrlState("view", "text"); // 'text' | 'graph'
    const [aiPrompt, setAiPrompt] = useState("");
    const [error, setError] = useState<JsonError | null>(null);
    const { history, addToHistory, clearHistory } = useHistory(HISTORY_KEY, 20);
    const [showHistory, setShowHistory] = useState(false);
    const { showToast } = useToast();

    const inputSize = useInputSize({
        warningThreshold: 1024 * 100, // 100KB
        heavyThreshold: 1024 * 500, // 500KB
        criticalThreshold: 1024 * 1024, // 1MB
        maxSize: 10 * 1024 * 1024, // 10MB hard limit
    });

    const { execute: runJsonWorker, isReady: workerReady } = useWorker(
        jsonWorkerScript,
        {
            maxConcurrent: 1,
            timeout: 60000,
            onError: (err: any) => {
                console.error("JSON Worker error:", err);
                showToast("Processing error occurred", "error");
            },
        },
    );

    const handleAiResult = (response: string) => {
        const cleaned = response
            .trim()
            .replace(/^```json\n?|```javascript\n?|```\n?|```$/g, "");
        try {
            const parsed = JSON.parse(cleaned);
            const formatted = JSON.stringify(parsed, null, 2);
            setCode(formatted);
            addToHistory({
                content: formatted,
                type: "AI Generation",
                timestamp: Date.now(),
            });
            setError(null);
        } catch (e) {
            setCode(cleaned);
        }
    };

    const formatJson = useCallback(async () => {
        setError(null);
        inputSize.startProcessing();

        const shouldUseWorker = inputSize.size > 1024 * 100;

        try {
            let result;

            if (shouldUseWorker && workerReady) {
                result = await runJsonWorker("format", code);
            } else {
                const parsed = JSON.parse(code);
                result = JSON.stringify(parsed, null, 2);
            }

            setCode(result as string);
            addToHistory({
                content: result as string,
                type: "Format",
                timestamp: Date.now(),
            });
            showToast("JSON formatted successfully", "success");
        } catch (e: any) {
            const errorInfo = parseJsonError(e, code);
            setError(errorInfo);
            showToast("Invalid JSON", "error");
        } finally {
            inputSize.finishProcessing();
        }
    }, [code, inputSize, runJsonWorker, workerReady, showToast, addToHistory]);

    const minifyJson = useCallback(async () => {
        setError(null);
        inputSize.startProcessing();

        const shouldUseWorker = inputSize.size > 1024 * 100;

        try {
            let result;

            if (shouldUseWorker && workerReady) {
                result = await runJsonWorker("minify", code);
            } else {
                const parsed = JSON.parse(code);
                result = JSON.stringify(parsed);
            }

            setCode(result as string);
            addToHistory({
                content: result as string,
                type: "Minify",
                timestamp: Date.now(),
            });
            showToast("JSON minified successfully", "success");
        } catch (e: any) {
            const errorInfo = parseJsonError(e, code);
            setError(errorInfo);
            showToast("Invalid JSON", "error");
        } finally {
            inputSize.finishProcessing();
        }
    }, [code, inputSize, runJsonWorker, workerReady, showToast, addToHistory]);

    const cleanJson = () => {
        setCode("");
        setError(null);
        inputSize.reset();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        showToast("Copied to clipboard", "success");
    };

    const loadFromHistory = (item: any) => {
        setCode(item.content);
        setShowHistory(false);
        showToast("Restored from history", "success");
    };

    useHotkeys("Enter", formatJson, { meta: true });
    useHotkeys("m", minifyJson, { meta: true, shift: true });
    useHotkeys("c", copyToClipboard, { meta: true, shift: true });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JSON Formatter</h1>
                <div className={styles.actions}>
                    <ShareButton />
                    <button
                        className={styles.button}
                        onClick={() => setShowHistory(true)}
                        title="History"
                    >
                        <History size={16} /> History
                    </button>
                    <button
                        className={styles.button}
                        onClick={formatJson}
                        title="Format (Cmd/Ctrl + Enter)"
                    >
                        <Maximize size={16} /> Format
                    </button>
                    <button className={styles.button} onClick={minifyJson} title="Minify">
                        <Minimize size={16} /> Minify
                    </button>
                    <button
                        className={styles.button}
                        onClick={copyToClipboard}
                        title="Copy"
                    >
                        <Copy size={16} /> Copy
                    </button>
                    <button className={styles.button} onClick={cleanJson} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            <SizeWarning inputSize={inputSize as any} />

            <AiAssistBar
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
                type="json"
                payload={{ code }}
                onResult={handleAiResult}
                placeholder="e.g., 'fix this broken JSON', 'convert this list to JSON', 'generate 5 user objects'"
            />

            {error && (
                <div className={styles.errorAlert}>
                    <div style={{ fontWeight: 600 }}>{error.message || (error as any)}</div>
                    {error.line && (
                        <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            Found at Line {error.line}, Column {error.col}
                        </div>
                    )}
                    {error.suggestion && (
                        <div
                            style={{
                                fontSize: "0.85rem",
                                marginTop: "0.5rem",
                                opacity: 0.9,
                                fontStyle: "italic",
                            }}
                        >
                            💡 Tip: {error.suggestion}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button
                                style={{
                                    background: view === 'text' ? 'var(--bg-hover)' : 'transparent',
                                    border: 'none',
                                    color: view === 'text' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 600
                                }}
                                onClick={() => setView('text')}
                            >
                                Text
                            </button>
                            <button
                                style={{
                                    background: view === 'graph' ? 'var(--bg-hover)' : 'transparent',
                                    border: 'none',
                                    color: view === 'graph' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 600
                                }}
                                onClick={() => setView('graph')}
                            >
                                Graph
                            </button>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <ActionToolbar content={code} currentToolId="json" />
                            <span className={styles.languageBadge}>JSON</span>
                        </div>
                    </div>
                    {view === 'text' ? (
                        <div className={styles.editorWrapper}>
                            <CodeMirrorEditor
                                value={code}
                                onChange={(code) => {
                                    setCode(code);
                                    inputSize.setInput(code);
                                }}
                                language="json"
                                placeholder="Paste your JSON here..."
                                onRun={formatJson}
                            />
                        </div>
                    ) : (
                        <div className={styles.graphContainer}>
                            <JsonGraph data={(() => {
                                try {
                                    return JSON.parse(code);
                                } catch (e) {
                                    return null;
                                }
                            })()} />
                        </div>
                    )}
                </div>
            </div>

            <HistorySidebar
                history={history}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onClear={clearHistory}
                onSelect={loadFromHistory}
                title="JSON History"
                renderItem={(item) => (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                            }}
                        >
                            {item.type} • {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                        <div
                            style={{
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                fontFamily: "monospace",
                            }}
                        >
                            {item.content.substring(0, 50)}
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
