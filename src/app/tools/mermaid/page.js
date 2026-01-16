'use client';

import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { GitGraph, Download, Trash2, Maximize } from 'lucide-react';
import CodeEditor from '@/components/common/CodeEditor';
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
    const [error, setError] = useState(null);

    const handleAiResult = (response) => {
        // Clean markdown code blocks if AI included them
        const cleaned = response.trim().replace(/^```mermaid\n?|```\n?|```$/g, '');
        setCode(cleaned);
    };

    useEffect(() => {
        const renderChart = async () => {
            try {
                // Unique ID for the render
                const { svg } = await mermaid.render('mermaid-svg', code);
                setSvg(svg);
                setError(null);
            } catch (e) {
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
                    <div className={styles.paneHeader}>
                        <span>Mermaid Syntax</span>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                            <ActionToolbar content={code} currentToolId="mermaid" />
                            <span className={styles.languageBadge}>Mermaid</span>
                        </div>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language="markdown"
                            placeholder="graph TD..."
                            onRun={handleDownload}
                        />
                    </div>
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>Preview</div>
                    <div
                        className={styles.preview}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <AiDisclaimer featureName="Mermaid AI Generation" />
            </div>
        </div>
    );
}
