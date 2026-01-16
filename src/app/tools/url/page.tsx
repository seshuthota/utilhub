'use client';

import { useState, useEffect } from 'react';
import { ArrowRightLeft, Copy, Trash2 } from 'lucide-react';
import styles from './page.module.css';

export default function UrlTool() {
    const [input, setInput] = useState('https://utilhub.vercel.app/tools?query=hello world');
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [output, setOutput] = useState('');

    const process = (val: string, currentMode: 'encode' | 'decode') => {
        try {
            if (currentMode === 'encode') {
                setOutput(encodeURIComponent(val));
            } else {
                setOutput(decodeURIComponent(val));
            }
        } catch (e) {
            setOutput('Error: Invalid URI');
        }
    };

    // Auto-convert
    useEffect(() => {
        process(input, mode);
    }, [input, mode]);

    const handleModeToggle = () => {
        const newMode = mode === 'encode' ? 'decode' : 'encode';
        setMode(newMode);
        setInput(output);
        process(output, newMode);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>URL Encoder/Decoder</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={handleModeToggle} title="Switch Mode">
                        <ArrowRightLeft size={16} /> Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
                    </button>
                    <button className={styles.button} onClick={() => setInput('')} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            <div className={styles.split}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        {mode === 'encode' ? 'Decoded URL' : 'Encoded URL'}
                    </div>
                    <textarea
                        className={styles.textarea}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === 'encode' ? "Paste URL to encode..." : "Paste URL to decode..."}
                    />
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        {mode === 'encode' ? 'Encoded Output' : 'Decoded Output'}
                        <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(output)}>
                            <Copy size={14} />
                        </button>
                    </div>
                    <textarea
                        className={styles.textarea}
                        value={output}
                        readOnly
                        placeholder="Result will appear here..."
                    />
                </div>
            </div>
        </div>
    );
}
