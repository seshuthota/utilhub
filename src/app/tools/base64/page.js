'use client';

import { useState, useEffect } from 'react';
import { Base64 } from 'js-base64';
import { RefreshCcw, Copy, Trash2, ArrowRightLeft } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import styles from './page.module.css';

export default function Base64Tool() {
    const [input, setInput] = useUrlState('input', 'Hello UtilHub');
    const [mode, setMode] = useState('encode'); // encode | decode
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);

    // Auto-convert on change
    useState(() => {
        try {
            if (mode === 'encode') {
                setOutput(Base64.encode(input));
            } else {
                setOutput(Base64.decode(input));
            }
            setError(null);
        } catch (e) {
            if (mode === 'decode') {
                // Only show decode errors if input is substantial
                setError('Invalid Base64 string');
            }
        }
    }, [input, mode]);

    const handleModeToggle = () => {
        setMode(mode === 'encode' ? 'decode' : 'encode');
        // Swap buffer
        setInput(output);
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setInput(val);
        try {
            if (mode === 'encode') {
                setOutput(Base64.encode(val));
            } else {
                // Basic check before decoding
                if (val.length > 0) setOutput(Base64.decode(val));
                else setOutput('');
            }
            setError(null);
        } catch (e) {
            setError("Invalid input for decoding");
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Base64 Converter</h1>
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
                        {mode === 'encode' ? 'Text Input' : 'Base64 Input'}
                    </div>
                    <textarea
                        className={styles.textarea}
                        value={input}
                        onChange={handleChange}
                        placeholder={mode === 'encode' ? "Type text to encode..." : "Paste Base64 to decode..."}
                    />
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        {mode === 'encode' ? 'Base64 Output' : 'Text Output'}
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
