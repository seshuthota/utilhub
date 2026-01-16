'use client';

import { useState, useCallback } from "react";
import { Split, AlertTriangle, Clock, Loader2 } from "lucide-react";
import styles from "./page.module.css";

import { useInputSize } from "@/hooks/useInputSize";
import { useToast } from "@/components/Toast";

import diffWorkerScript from "@/workers/diff.worker.js?raw";
import { useWorker } from "@/hooks/useWorker";

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
        warning: "Large input - using background processing",
        heavy: "Very large input - processing may take several seconds",
        critical: "Input size exceeds recommended limit",
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                marginTop: "0.5rem",
                ...style,
            }}
        >
            <AlertTriangle size={12} />
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
                    <Clock size={10} />
                    {inputSize.estimatedTime}
                </span>
            )}
        </div>
    );
}

interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
}

function computeDiffSync(oldStr: string, newStr: string): DiffPart[] {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");

    const result: DiffPart[] = [];
    let oldI = 0,
        newI = 0;

    while (oldI < oldLines.length || newI < newLines.length) {
        if (oldI >= oldLines.length) {
            result.push({ value: newLines[newI] + "\n", added: true });
            newI++;
        } else if (newI >= newLines.length) {
            result.push({ value: oldLines[oldI] + "\n", removed: true });
            oldI++;
        } else if (oldLines[oldI] === newLines[newI]) {
            result.push({ value: oldLines[oldI] + "\n" });
            oldI++;
            newI++;
        } else {
            const oldNext = oldLines.indexOf(newLines[newI], oldI);
            const newNext = newLines.indexOf(oldLines[oldI], newI);

            if (oldNext === -1 && newNext === -1) {
                result.push({ value: oldLines[oldI] + "\n", removed: true });
                result.push({ value: newLines[newI] + "\n", added: true });
                oldI++;
                newI++;
            } else if (
                newNext !== -1 &&
                (oldNext === -1 || newNext - newI < oldNext - oldI)
            ) {
                for (let i = newI; i < newNext; i++) {
                    result.push({ value: newLines[i] + "\n", added: true });
                }
                newI = newNext;
            } else {
                for (let i = oldI; i < oldNext; i++) {
                    result.push({ value: oldLines[i] + "\n", removed: true });
                }
                oldI = oldNext;
            }
        }
    }

    return result;
}

export default function DiffTool() {
    const [oldText, setOldText] = useState(
        'const foo = "bar";\nconsole.log(foo);',
    );
    const [newText, setNewText] = useState(
        'const foo = "baz";\nconsole.log("changed");',
    );
    const [diffResult, setDiffResult] = useState<DiffPart[]>([]);
    const { showToast } = useToast();

    const oldInputSize = useInputSize({
        warningThreshold: 1024 * 100, // 100KB
        heavyThreshold: 1024 * 500, // 500KB
        criticalThreshold: 1024 * 1024, // 1MB
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const newInputSize = useInputSize({
        warningThreshold: 1024 * 100, // 100KB
        heavyThreshold: 1024 * 500, // 500KB
        criticalThreshold: 1024 * 1024, // 1MB
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const { execute: runDiffWorker, isReady: workerReady } = useWorker(
        diffWorkerScript,
        {
            maxConcurrent: 1,
            timeout: 60000,
            onError: (err: any) => {
                console.error("Diff Worker error:", err);
                showToast("Diff computation error", "error");
            },
        },
    );

    const handleComputeDiff = useCallback(async () => {
        const totalSize = oldText.length + newText.length;
        oldInputSize.startProcessing();
        newInputSize.startProcessing();

        const shouldUseWorker = totalSize > 1024 * 100;

        try {
            let result;

            if (shouldUseWorker && workerReady) {
                result = await runDiffWorker("diffLines", {
                    oldText,
                    newText,
                });
            } else {
                result = computeDiffSync(oldText, newText);
            }

            setDiffResult(result as DiffPart[]);
            showToast("Diff computed successfully", "success");
        } catch (error) {
            console.error("Diff error:", error);
            showToast("Failed to compute diff", "error");
        } finally {
            oldInputSize.finishProcessing();
            newInputSize.finishProcessing();
        }
    }, [
        oldText,
        newText,
        runDiffWorker,
        workerReady,
        showToast,
        oldInputSize,
        newInputSize,
    ]);

    return (
        <div className={styles.container}>
            <header
                style={{
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                }}
            >
                <Split size={24} />
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Diff Checker</h1>
            </header>

            <div className={styles.inputs}>
                <div className={styles.inputPane}>
                    <div className={styles.paneHeader}>Original Text</div>
                    <textarea
                        className={styles.textarea}
                        value={oldText}
                        onChange={(e) => {
                            setOldText(e.target.value);
                            oldInputSize.setInput(e.target.value);
                        }}
                        placeholder="Paste original text here..."
                    />
                    <SizeWarning inputSize={oldInputSize as any} />
                </div>
                <div className={styles.inputPane}>
                    <div className={styles.paneHeader}>New Text</div>
                    <textarea
                        className={styles.textarea}
                        value={newText}
                        onChange={(e) => {
                            setNewText(e.target.value);
                            newInputSize.setInput(e.target.value);
                        }}
                        placeholder="Paste new text here..."
                    />
                    <SizeWarning inputSize={newInputSize as any} />
                </div>
            </div>

            {(oldInputSize.isProcessing || newInputSize.isProcessing) && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem",
                        background: "var(--accent-glow)",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                    }}
                >
                    <Loader2 size={16} className="animate-spin" />
                    <span>Computing diff...</span>
                </div>
            )}

            <button
                onClick={handleComputeDiff}
                style={{
                    marginBottom: "1rem",
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--accent-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                }}
            >
                Compute Diff
            </button>

            <div className={styles.diffContainer}>
                {diffResult.map((part, index) => {
                    const colorClass = part.added
                        ? styles.added
                        : part.removed
                            ? styles.removed
                            : styles.neutral;
                    return (
                        <span key={index} className={`${styles.diffLine} ${colorClass}`}>
                            {part.value}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
