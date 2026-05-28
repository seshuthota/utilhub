'use client';

import { useState, useEffect } from 'react';
import { Base64 } from 'js-base64';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import { useToast } from '@/components/Toast';
import ActionToolbar from '@/components/common/ActionToolbar';
import styles from './page.module.css';

type Mode = 'encode' | 'decode';

function convert(value: string, mode: Mode): { output: string; error: string | null } {
    if (!value) return { output: '', error: null };
    try {
        const result = mode === 'encode' ? Base64.encode(value) : Base64.decode(value);
        return { output: result, error: null };
    } catch {
        return { output: '', error: mode === 'decode' ? 'Invalid Base64 string' : 'Invalid input' };
    }
}

export default function Base64Tool() {
    const [input, setInput] = useUrlState('input', 'Hello UtilHub');
    const [mode, setMode] = useState<Mode>('encode');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const { output: out, error: err } = convert(input, mode);
        setOutput(out);
        setError(err);
    }, [input, mode]);

    const handleChange = (val: string) => {
        setInput(val);
        const { output: out, error: err } = convert(val, mode);
        setOutput(out);
        setError(err);
    };

    const handleSwitchMode = () => {
        const newMode: Mode = mode === 'encode' ? 'decode' : 'encode';
        setMode(newMode);
        setInput(output);
        const { output: out, error: err } = convert(output, newMode);
        setOutput(out);
        setError(err);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Base64 Converter</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={handleSwitchMode} title="Switch Mode">
                        <ArrowRightLeft size={16} /> Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
                    </button>
                    <button className={styles.button} onClick={() => { setInput(''); setOutput(''); setError(null); }} title="Clear">
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
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={mode === 'encode' ? "Type text to encode..." : "Paste Base64 to decode..."}
                    />
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span>{mode === 'encode' ? 'Base64 Output' : 'Text Output'}</span>
                        <ActionToolbar content={output} currentToolId="base64" />
                    </div>
                    <textarea
                        className={styles.textarea}
                        value={output}
                        readOnly
                        placeholder="Result will appear here..."
                    />
                    {error && (
                        <div style={{ color: 'var(--error-color)', padding: '10px', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
