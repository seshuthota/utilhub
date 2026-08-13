'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Split,
    Columns2,
    AlignJustify,
    ArrowLeftRight,
    Trash2,
    Upload,
    Copy,
    FileJson,
    Plus,
    Minus,
    Equal,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import {
    computeTextDiff,
    collapseUnchanged,
    tryPrettyJson,
    type DiffGranularity,
    type DiffViewMode,
    type DiffRow,
    type InnerPart,
} from "@/utils/textDiff";
import styles from "./page.module.css";

const DEFAULT_OLD = `const greet = (name) => {
  console.log("Hello, " + name);
};

greet("world");`;

const DEFAULT_NEW = `const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};

greet("UtilHub");
greet("friend");`;

function renderParts(parts: InnerPart[] | undefined, fallback: string) {
    if (!parts || parts.length === 0) return fallback;
    return parts.map((p, i) => (
        <span
            key={i}
            className={
                p.type === "add"
                    ? styles.innerAdd
                    : p.type === "del"
                      ? styles.innerDel
                      : undefined
            }
        >
            {p.text}
        </span>
    ));
}

function rowClass(type: DiffRow["type"], side: "left" | "right") {
    if (type === "equal") return styles.rowEqual;
    if (type === "change") return styles.rowChange;
    if (type === "add") return side === "right" ? styles.rowAdd : styles.rowEmpty;
    if (type === "del") return side === "left" ? styles.rowDel : styles.rowEmpty;
    return "";
}

export default function DiffTool() {
    const [oldText, setOldText] = useState(DEFAULT_OLD);
    const [newText, setNewText] = useState(DEFAULT_NEW);
    const [granularity, setGranularity] = useState<DiffGranularity>("lines");
    const [view, setView] = useState<DiffViewMode>("split");
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [live, setLive] = useState(true);
    const [collapse, setCollapse] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const oldFileRef = useRef<HTMLInputElement>(null);
    const newFileRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const raw = useMemo(
        () =>
            computeTextDiff(oldText, newText, {
                granularity,
                ignoreWhitespace,
                ignoreCase,
            }),
        [oldText, newText, granularity, ignoreWhitespace, ignoreCase],
    );

    const rows = useMemo(() => {
        if (!collapse || expanded) return raw.rows;
        return collapseUnchanged(raw.rows, 2);
    }, [raw.rows, collapse, expanded]);

    const [visible, setVisible] = useState(raw);

    useEffect(() => {
        if (!live) return;
        const t = setTimeout(() => {
            setVisible(raw);
            setExpanded(false);
        }, 180);
        return () => clearTimeout(t);
    }, [raw, live]);

    const display = live ? { ...raw, rows } : { ...visible, rows: collapse && !expanded ? collapseUnchanged(visible.rows, 2) : visible.rows };

    const findDifference = useCallback(() => {
        setVisible(raw);
        setExpanded(false);
        const { added, removed, changed } = raw.stats;
        if (added + removed + changed === 0) {
            showToast("No differences", "success");
        } else {
            showToast(
                `${added} added · ${removed} removed · ${changed} changed`,
                "success",
            );
        }
    }, [raw, showToast]);

    const swap = () => {
        setOldText(newText);
        setNewText(oldText);
    };

    const clearAll = () => {
        setOldText("");
        setNewText("");
        showToast("Cleared", "success");
    };

    const loadFile = (side: "old" | "new", file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || "");
            if (side === "old") setOldText(text);
            else setNewText(text);
            showToast(`Loaded ${file.name}`, "success");
        };
        reader.readAsText(file);
    };

    const prettyBoth = () => {
        const a = tryPrettyJson(oldText);
        const b = tryPrettyJson(newText);
        if (!a || !b) {
            showToast("Both sides must be valid JSON", "error");
            return;
        }
        setOldText(a);
        setNewText(b);
        showToast("Pretty-printed JSON", "success");
    };

    const copyPatch = () => {
        navigator.clipboard.writeText(display.patch);
        showToast("Unified patch copied", "success");
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <Split size={22} aria-hidden /> Diff Checker
                </h1>
                <div className={styles.stats} aria-live="polite">
                    <span className={styles.statAdd}>
                        <Plus size={12} /> {display.stats.added} added
                    </span>
                    <span className={styles.statDel}>
                        <Minus size={12} /> {display.stats.removed} removed
                    </span>
                    <span className={styles.statChg}>
                        {display.stats.changed} changed
                    </span>
                    <span className={styles.statEq}>
                        <Equal size={12} /> {display.stats.unchanged} same
                    </span>
                </div>
            </header>

            <div className={styles.toolbar} role="toolbar" aria-label="Diff options">
                <div className={styles.seg} role="group" aria-label="Granularity">
                    {(["lines", "words", "chars"] as DiffGranularity[]).map((g) => (
                        <button
                            key={g}
                            type="button"
                            className={granularity === g ? styles.segActive : ""}
                            onClick={() => setGranularity(g)}
                        >
                            {g === "lines" ? "Lines" : g === "words" ? "Words" : "Chars"}
                        </button>
                    ))}
                </div>

                <div className={styles.seg} role="group" aria-label="View">
                    <button
                        type="button"
                        className={view === "split" ? styles.segActive : ""}
                        onClick={() => setView("split")}
                        title="Side by side"
                    >
                        <Columns2 size={14} /> Split
                    </button>
                    <button
                        type="button"
                        className={view === "unified" ? styles.segActive : ""}
                        onClick={() => setView("unified")}
                        title="Unified"
                    >
                        <AlignJustify size={14} /> Unified
                    </button>
                </div>

                <label className={styles.check}>
                    <input
                        type="checkbox"
                        checked={ignoreWhitespace}
                        onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                    />
                    Ignore whitespace
                </label>
                <label className={styles.check}>
                    <input
                        type="checkbox"
                        checked={ignoreCase}
                        onChange={(e) => setIgnoreCase(e.target.checked)}
                    />
                    Ignore case
                </label>
                <label className={styles.check}>
                    <input
                        type="checkbox"
                        checked={live}
                        onChange={(e) => setLive(e.target.checked)}
                    />
                    Live
                </label>
                <label className={styles.check}>
                    <input
                        type="checkbox"
                        checked={collapse}
                        onChange={(e) => {
                            setCollapse(e.target.checked);
                            setExpanded(false);
                        }}
                    />
                    Collapse unchanged
                </label>

                <div className={styles.toolbarSpacer} />

                <button type="button" className={styles.toolBtn} onClick={swap} title="Swap sides">
                    <ArrowLeftRight size={14} /> Swap
                </button>
                <button type="button" className={styles.toolBtn} onClick={prettyBoth} title="Pretty-print if JSON">
                    <FileJson size={14} /> JSON
                </button>
                <button type="button" className={styles.toolBtn} onClick={copyPatch}>
                    <Copy size={14} /> Patch
                </button>
                <button type="button" className={styles.toolBtn} onClick={clearAll}>
                    <Trash2 size={14} /> Clear
                </button>
            </div>

            <div className={styles.editors}>
                <div className={styles.editorPane}>
                    <div className={styles.paneHeader}>
                        <span>Original</span>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => oldFileRef.current?.click()}
                            title="Upload file"
                        >
                            <Upload size={14} /> File
                        </button>
                        <input
                            ref={oldFileRef}
                            type="file"
                            className={styles.hidden}
                            onChange={(e) => {
                                loadFile("old", e.target.files?.[0]);
                                e.target.value = "";
                            }}
                        />
                    </div>
                    <textarea
                        className={styles.textarea}
                        value={oldText}
                        onChange={(e) => setOldText(e.target.value)}
                        placeholder="Paste original text here..."
                        spellCheck={false}
                        aria-label="Original text"
                    />
                </div>
                <div className={styles.editorPane}>
                    <div className={styles.paneHeader}>
                        <span>Changed</span>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => newFileRef.current?.click()}
                            title="Upload file"
                        >
                            <Upload size={14} /> File
                        </button>
                        <input
                            ref={newFileRef}
                            type="file"
                            className={styles.hidden}
                            onChange={(e) => {
                                loadFile("new", e.target.files?.[0]);
                                e.target.value = "";
                            }}
                        />
                    </div>
                    <textarea
                        className={styles.textarea}
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Paste new text here..."
                        spellCheck={false}
                        aria-label="Changed text"
                    />
                </div>
            </div>

            {!live && (
                <button type="button" className={styles.findBtn} onClick={findDifference}>
                    Find difference
                </button>
            )}

            {view === "split" ? (
                <div className={styles.splitView} role="table" aria-label="Side-by-side diff">
                    <div className={styles.splitCol}>
                        {display.rows.map((row, i) =>
                            row.type === "collapse" ? (
                                <button
                                    key={i}
                                    type="button"
                                    className={styles.collapse}
                                    onClick={() => setExpanded(true)}
                                >
                                    ⋯ {row.hiddenCount} unchanged lines — click to expand
                                </button>
                            ) : (
                                <div key={i} className={`${styles.splitRow} ${rowClass(row.type, "left")}`}>
                                    <span className={styles.gutter}>{row.leftNum ?? ""}</span>
                                    <span className={styles.sign}>
                                        {row.type === "del" || row.type === "change" ? "−" : " "}
                                    </span>
                                    <span className={styles.code}>
                                        {renderParts(row.leftParts, row.left)}
                                    </span>
                                </div>
                            ),
                        )}
                    </div>
                    <div className={styles.splitCol}>
                        {display.rows.map((row, i) =>
                            row.type === "collapse" ? (
                                <button
                                    key={i}
                                    type="button"
                                    className={styles.collapse}
                                    onClick={() => setExpanded(true)}
                                >
                                    ⋯ {row.hiddenCount} unchanged lines — click to expand
                                </button>
                            ) : (
                                <div key={i} className={`${styles.splitRow} ${rowClass(row.type, "right")}`}>
                                    <span className={styles.gutter}>{row.rightNum ?? ""}</span>
                                    <span className={styles.sign}>
                                        {row.type === "add" || row.type === "change" ? "+" : " "}
                                    </span>
                                    <span className={styles.code}>
                                        {renderParts(row.rightParts, row.right)}
                                    </span>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            ) : (
                <div className={styles.unifiedView} aria-label="Unified diff">
                    {display.rows.map((row, i) => {
                        if (row.type === "collapse") {
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={styles.collapse}
                                    onClick={() => setExpanded(true)}
                                >
                                    ⋯ {row.hiddenCount} unchanged lines — click to expand
                                </button>
                            );
                        }
                        if (row.type === "equal") {
                            return (
                                <div key={i} className={`${styles.uniRow} ${styles.rowEqual}`}>
                                    <span className={styles.gutter}>{row.leftNum}</span>
                                    <span className={styles.gutter}>{row.rightNum}</span>
                                    <span className={styles.sign}> </span>
                                    <span className={styles.code}>{row.left}</span>
                                </div>
                            );
                        }
                        return (
                            <div key={i}>
                                {(row.type === "del" || row.type === "change") && (
                                    <div className={`${styles.uniRow} ${styles.rowDel}`}>
                                        <span className={styles.gutter}>{row.leftNum}</span>
                                        <span className={styles.gutter} />
                                        <span className={styles.sign}>−</span>
                                        <span className={styles.code}>
                                            {renderParts(row.leftParts, row.left)}
                                        </span>
                                    </div>
                                )}
                                {(row.type === "add" || row.type === "change") && (
                                    <div className={`${styles.uniRow} ${styles.rowAdd}`}>
                                        <span className={styles.gutter} />
                                        <span className={styles.gutter}>{row.rightNum}</span>
                                        <span className={styles.sign}>+</span>
                                        <span className={styles.code}>
                                            {renderParts(row.rightParts, row.right)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
