'use client';

import { useState, useEffect, useRef, useCallback, CSSProperties } from 'react';
import { marked } from 'marked';
import {
    Copy,
    Trash2,
    Columns2,
    PanelLeft,
    PanelRight,
    PanelLeftClose,
    PanelRightClose,
    GripVertical,
} from 'lucide-react';
import CodeMirrorEditor from '@/components/common/CodeMirrorEditor';
import { useToast } from '@/components/Toast';
import { sanitizeHtml } from '@/utils/sanitize';
import styles from './page.module.css';

type ViewMode = 'split' | 'editor' | 'preview';

const defaultMarkdown = `# Welcome to Markdown Viewer

This is a **live preview** editor. 

## Features
- Syntax Highlighting
- Real-time conversion
- Clean, monochrome design

\`\`\`javascript
console.log("Hello UtilHub!");
\`\`\`
`;

const LAYOUT_KEY = 'utilhub-markdown-layout';
const MIN_PANE = 18;
const MAX_PANE = 82;
const DEFAULT_SPLIT = 50;

interface SavedLayout {
    view: ViewMode;
    split: number;
}

function clampSplit(value: number): number {
    return Math.min(MAX_PANE, Math.max(MIN_PANE, Math.round(value * 10) / 10));
}

function isViewMode(value: unknown): value is ViewMode {
    return value === 'split' || value === 'editor' || value === 'preview';
}

function readSavedLayout(): SavedLayout {
    try {
        const raw = localStorage.getItem(LAYOUT_KEY);
        if (!raw) return { view: 'split', split: DEFAULT_SPLIT };
        const parsed = JSON.parse(raw) as Partial<SavedLayout>;
        return {
            view: isViewMode(parsed.view) ? parsed.view : 'split',
            split: typeof parsed.split === 'number' && Number.isFinite(parsed.split)
                ? clampSplit(parsed.split)
                : DEFAULT_SPLIT,
        };
    } catch {
        return { view: 'split', split: DEFAULT_SPLIT };
    }
}

export default function MarkdownTool() {
    const [code, setCode] = useState(defaultMarkdown);
    const [html, setHtml] = useState('');
    const [view, setView] = useState<ViewMode>('split');
    const [split, setSplit] = useState(DEFAULT_SPLIT);
    const [dragging, setDragging] = useState(false);
    const [layoutReady, setLayoutReady] = useState(false);
    const { showToast } = useToast();

    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);

    useEffect(() => {
        const saved = readSavedLayout();
        setView(saved.view);
        setSplit(saved.split);
        setLayoutReady(true);
    }, []);

    useEffect(() => {
        if (!layoutReady) return;
        localStorage.setItem(LAYOUT_KEY, JSON.stringify({ view, split }));
    }, [view, split, layoutReady]);

    useEffect(() => {
        const parsed = marked.parse(code);
        if (typeof parsed === 'string') {
            setHtml(sanitizeHtml(parsed));
        } else {
            parsed.then((val: string) => setHtml(sanitizeHtml(val)));
        }
    }, [code]);

    const applyPointerPosition = useCallback((clientX: number, clientY: number) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const vertical = window.innerWidth <= 768;
        const pct = vertical
            ? ((clientY - rect.top) / rect.height) * 100
            : ((clientX - rect.left) / rect.width) * 100;

        setSplit(clampSplit(pct));
        setView('split');
    }, []);

    const onGutterPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        draggingRef.current = true;
        setDragging(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    }, []);

    const onGutterPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return;
        applyPointerPosition(e.clientX, e.clientY);
    }, [applyPointerPosition]);

    const endDrag = useCallback(() => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        setDragging(false);
    }, []);

    useEffect(() => {
        if (!dragging) return;

        const onMove = (e: PointerEvent) => applyPointerPosition(e.clientX, e.clientY);
        const onUp = () => endDrag();
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);

        const previousCursor = document.body.style.cursor;
        const previousSelect = document.body.style.userSelect;
        document.body.style.cursor = window.innerWidth <= 768 ? 'row-resize' : 'col-resize';
        document.body.style.userSelect = 'none';

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousSelect;
        };
    }, [dragging, applyPointerPosition, endDrag]);

    const resetSplit = useCallback(() => {
        setSplit(DEFAULT_SPLIT);
        setView('split');
    }, []);

    const handleCopy = () => {
        if (html) {
            navigator.clipboard.writeText(html);
            showToast('HTML copied to clipboard', 'success');
        }
    };

    const handleClear = () => {
        setCode('');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Markdown Viewer</h1>
                <div className={styles.actions}>
                    <div className={styles.viewToggle} role="group" aria-label="Layout">
                        <button
                            type="button"
                            className={`${styles.toggleButton} ${view === 'editor' ? styles.toggleActive : ''}`}
                            aria-pressed={view === 'editor'}
                            title="Editor only"
                            onClick={() => setView('editor')}
                        >
                            <PanelLeft size={16} />
                            <span className={styles.toggleLabel}>Editor</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.toggleButton} ${view === 'split' ? styles.toggleActive : ''}`}
                            aria-pressed={view === 'split'}
                            title="Split view"
                            onClick={() => setView('split')}
                        >
                            <Columns2 size={16} />
                            <span className={styles.toggleLabel}>Split</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.toggleButton} ${view === 'preview' ? styles.toggleActive : ''}`}
                            aria-pressed={view === 'preview'}
                            title="Preview only"
                            onClick={() => setView('preview')}
                        >
                            <PanelRight size={16} />
                            <span className={styles.toggleLabel}>Preview</span>
                        </button>
                    </div>
                    <button className={styles.button} onClick={handleClear} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                    <button className={styles.button} onClick={handleCopy} title="Copy HTML">
                        <Copy size={16} /> Copy HTML
                    </button>
                </div>
            </header>

            <div
                ref={containerRef}
                className={`${styles.editorContainer} ${dragging ? styles.isDragging : ''}`}
                data-view={view}
                data-testid="markdown-split"
                style={{ '--editor-size': `${split}%` } as CSSProperties}
            >
                <div
                    className={`${styles.pane} ${styles.sizedPane} ${styles.editorPane}`}
                    hidden={view === 'preview'}
                >
                    <div className={styles.paneHeader}>
                        <span>Editor</span>
                        <div className={styles.paneHeaderActions}>
                            <span className={styles.languageBadge}>Markdown</span>
                            <button
                                type="button"
                                className={styles.iconButton}
                                title="Collapse editor"
                                aria-label="Collapse editor"
                                onClick={() => setView('preview')}
                            >
                                <PanelLeftClose size={16} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeMirrorEditor
                            value={code}
                            onChange={setCode}
                            language="markdown"
                            placeholder="# Type markdown here..."
                        />
                    </div>
                </div>

                {view === 'split' && (
                    <div
                        className={styles.gutter}
                        role="separator"
                        aria-orientation="vertical"
                        aria-valuenow={Math.round(split)}
                        aria-valuemin={MIN_PANE}
                        aria-valuemax={MAX_PANE}
                        aria-label="Resize editor and preview"
                        title="Drag to resize · double-click to reset"
                        onPointerDown={onGutterPointerDown}
                        onPointerMove={onGutterPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onDoubleClick={resetSplit}
                    >
                        <GripVertical size={14} className={styles.gutterGrip} aria-hidden />
                    </div>
                )}

                <div
                    className={`${styles.pane} ${styles.sizedPane} ${styles.previewPane}`}
                    hidden={view === 'editor'}
                >
                    <div className={styles.paneHeader}>
                        <span>Preview</span>
                        <button
                            type="button"
                            className={styles.iconButton}
                            title={view === 'preview' ? 'Show editor' : 'Collapse preview'}
                            aria-label={view === 'preview' ? 'Show editor' : 'Collapse preview'}
                            onClick={() => setView(view === 'preview' ? 'split' : 'editor')}
                        >
                            {view === 'preview' ? <PanelLeft size={16} /> : <PanelRightClose size={16} />}
                        </button>
                    </div>
                    <div
                        className={styles.preview}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>
            </div>
        </div>
    );
}
