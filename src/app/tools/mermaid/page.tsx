'use client';

import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { Download, Trash2 } from 'lucide-react';
import CodeMirrorEditor from '@/components/common/CodeMirrorEditor';
import ShareButton from '@/components/common/ShareButton';
import AiAssistBar from '@/components/common/AiAssistBar';
import AiDisclaimer from '@/components/common/AiDisclaimer';
import ActionToolbar from '@/components/common/ActionToolbar';
import { useUrlState } from '@/hooks/useUrlState';
import styles from '../markdown/page.module.css';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark', // or 'base' with overrides
    securityLevel: 'loose',
});

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
        const renderChart = async () => {
            try {
                // Unique ID for the render
                const { svg } = await mermaid.render('mermaid-svg', code);
                setSvg(svg);
                setError(null);
            } catch (e: any) {
                console.error("Mermaid error:", e);
                setError("Invalid Syntax");
            }
        };

        const timeout = setTimeout(renderChart, 500);
        return () => clearTimeout(timeout);
    }, [code]);

    const handleDownload = () => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chart.svg';
        a.click();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mermaid Chart</h1>
                <div className={styles.actions}>
                    <ShareButton />
                    <button className={styles.button} onClick={handleDownload} title="Download SVG (Cmd/Ctrl + Enter)">
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

            {error && <div className={styles.errorAlert}>{error}</div>}

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
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                {/* @ts-ignore */}
                <AiDisclaimer featureName="Mermaid AI Generation" />
            </div>
        </div>
    );
}
