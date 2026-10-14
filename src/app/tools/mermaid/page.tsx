'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import mermaid from 'mermaid';
import { Download, Trash2 } from 'lucide-react';
import CodeMirrorEditor from '@/components/common/CodeMirrorEditor';
import ShareButton from '@/components/common/ShareButton';
import AiAssistBar from '@/components/common/AiAssistBar';
import ActionToolbar from '@/components/common/ActionToolbar';
import { useUrlState } from '@/hooks/useUrlState';
import SafeSvgPreview from '@/components/common/SafeSvgPreview';
import { downloadFile } from '@/utils/download';
import styles from '../markdown/page.module.css';

type MermaidTheme = 'dark' | 'default';

// 'strict' encodes HTML in labels and disables click/JS callbacks; diagram code
// can come from shareable links or AI output.
const MERMAID_BASE_CONFIG = {
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
} as const;

let renderCounter = 0;

function getAppMermaidTheme(): MermaidTheme {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark';
}

function subscribeToAppTheme(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
}

/** Follows the app theme (data-theme on <html>) as a mermaid theme. */
function useMermaidTheme(): MermaidTheme {
    return useSyncExternalStore(subscribeToAppTheme, getAppMermaidTheme, () => 'dark');
}

function formatMermaidError(e: any): string {
    const message = typeof e?.message === 'string' && e.message.trim()
        ? e.message.trim()
        : typeof e?.str === 'string' ? e.str : 'Invalid Mermaid syntax';
    const line = e?.hash?.loc?.first_line ?? e?.hash?.line;
    if (typeof line === 'number' && !/line\s+\d+/i.test(message)) {
        return `Line ${line}: ${message}`;
    }
    return message;
}

const defaultChart = `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`;

export default function MermaidTool() {
    const [code, setCode] = useUrlState('code', defaultChart);
    const [aiPrompt, setAiPrompt] = useState('');
    const [svg, setSvg] = useState('');
    const [error, setError] = useState<string | null>(null);
    const theme = useMermaidTheme();

    // Helper to fix common AI syntax errors (e.g. unquoted parens in labels)
    const repairMermaidSyntax = (code: string) => {
        // Regex to find content like: |Label (with parens)|
        // and replace it with: |"Label (with parens)"|
        // Only target labels that contain ( or ) and are NOT already quoted
        return code.replace(/\|([^"|\r\n]*[()][^"|\r\n]*)\|/g, (match, labelContent) => {
            // Check if it's already properly quoted (the regex above tries to avoid it, but good to be safe)
            if (labelContent.trim().startsWith('"') && labelContent.trim().endsWith('"')) {
                return match;
            }
            return `|"${labelContent}"|`;
        });
    };

    const handleAiResult = (response: string) => {
        // Clean markdown code blocks if AI included them
        let cleaned = response.trim().replace(/^```mermaid\n?|```\n?|```$/g, '');

        // Apply syntax repair fallback
        cleaned = repairMermaidSyntax(cleaned);

        setCode(cleaned);
    };

    useEffect(() => {
        let cancelled = false;

        const renderChart = async () => {
            if (!code.trim()) {
                setSvg('');
                setError(null);
                return;
            }

            // Fresh id per render; mermaid uses it as a DOM id and CSS selector
            const id = `mermaid-render-${++renderCounter}`;
            try {
                mermaid.initialize({ ...MERMAID_BASE_CONFIG, theme });
                const { svg: rendered } = await mermaid.render(id, code);
                if (cancelled) return;
                setSvg(rendered);
                setError(null);
            } catch (e: any) {
                if (cancelled) return;
                setError(formatMermaidError(e));
            } finally {
                // Remove temp/error nodes mermaid may leave in document.body
                document.getElementById(id)?.remove();
                document.getElementById(`d${id}`)?.remove();
            }
        };

        const timeout = setTimeout(renderChart, 500);
        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [code, theme]);

    const handleDownload = () => {
        if (!svg) return;
        downloadFile(svg, 'chart.svg', 'image/svg+xml');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mermaid Chart</h1>
                <div className={styles.actions}>
                    <ShareButton />
                    <button
                        className={styles.button}
                        onClick={handleDownload}
                        disabled={!svg}
                        title="Download SVG (Cmd/Ctrl + Enter)"
                    >
                        <Download size={16} /> Download
                    </button>
                    <button className={styles.button} onClick={() => setCode('')} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {/* AI Assist Section */}
            <AiAssistBar
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
                type="mermaid"
                onResult={handleAiResult}
                placeholder="e.g., 'a sequence diagram for user login', 'a flowchart for order processing'"
            />

            {error && (
                <div className={styles.errorAlert} role="alert" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono, monospace)' }}>
                    {error}
                </div>
            )}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader} style={{ minHeight: '60px' }}>
                        <span>Mermaid Syntax</span>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                            <ActionToolbar content={code} currentToolId="mermaid" />
                            <span className={styles.languageBadge}>Mermaid</span>
                        </div>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeMirrorEditor
                            value={code}
                            onChange={setCode}
                            language="markdown"
                            placeholder="graph TD..."
                            onRun={handleDownload}
                        />
                    </div>
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader} style={{ minHeight: '60px' }}>Preview</div>
                    <div
                        className={styles.preview}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}
                    >
                        {/* Rendered as an <img> so nothing inside the SVG can execute */}
                        <SafeSvgPreview svg={svg} alt="Mermaid diagram preview" background="none" />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
            </div>
        </div>
    );
}
