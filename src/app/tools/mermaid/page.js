'use client';

import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { GitGraph, Download, Trash2, Maximize } from 'lucide-react';
import CodeEditor from '@/components/common/CodeEditor';
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
    const [code, setCode] = useState(defaultChart);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);

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
                    <button className={styles.button} onClick={handleDownload} title="Download SVG">
                        <Download size={16} /> Download
                    </button>
                    <button className={styles.button} onClick={() => setCode('')} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span>Mermaid Syntax</span>
                        <span className={styles.languageBadge}>Mermaid</span>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language="markdown"
                            placeholder="graph TD..."
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
        </div>
    );
}
