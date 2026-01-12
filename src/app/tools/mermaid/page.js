'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import mermaid from 'mermaid';
import { GitGraph, Download, Trash2, Maximize } from 'lucide-react';
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
                // Mermaid throws annoying errors that persist in the DOM sometimes.
                // We just catch it.
                setError("Invalid Syntax");
            }
        };

        // Debounce slightly to prevent flashing on every keystroke
        const timeout = setTimeout(renderChart, 500);
        return () => clearTimeout(timeout);
    }, [code]);

    const handleDownload = () => {
        // Simple SVG download logic could go here
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
                        <Download size={16} /> Download SVG
                    </button>
                    <button className={styles.button} onClick={() => setCode('')} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && <div style={{ color: '#ff4444', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ff4444', borderRadius: '4px' }}>{error} - Check console for details</div>}

            <div className={styles.editorContainer}>
                <div className={`${styles.pane} ${styles.editorPane}`}>
                    <div className={styles.paneHeader}>Mermaid Syntax</div>
                    <div className={styles.editor}>
                        <Editor
                            value={code}
                            onValueChange={code => setCode(code)}
                            highlight={code => Prism.highlight(code, Prism.languages.markup || Prism.languages.extend('markup', {}), 'markup')} // No official mermaid prism, use markup or plain
                            padding={20}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 14,
                                backgroundColor: 'transparent',
                                minHeight: '100%',
                            }}
                            textareaClassName="focus:outline-none"
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
