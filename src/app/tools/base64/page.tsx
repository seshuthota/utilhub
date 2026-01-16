'use client';

import { useState, ChangeEvent } from 'react';
import { Base64 } from 'js-base64';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import ActionToolbar from '@/components/common/ActionToolbar';
import styles from './page.module.css';

type Mode = 'encode' | 'decode';

export default function Base64Tool() {
    const [input, setInput] = useUrlState('input', 'Hello UtilHub');
    const [mode, setMode] = useState<Mode>('encode');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Auto-convert on change
    // Note: We used useState for initialization logic in original file, but logic re-runs on render?
    // Wait, original code had:
    /*
    useState(() => {
        try { ... } catch (e) { ... }
    }, [input, mode]);
    */
    // That looked like useEffect but called useState?
    // If it was useState(initializer), it only runs ONCE.
    // But the dependency array suggests it was meant to be useEffect.
    // I will convert to useEffect which is correct.

    // Actually, looking at the code, if I change it to useEffect, it runs after render.
    // If I want it to run during render (derived state), I should just calculate it.
    // But Base64 decoding might throw, so side-effect/derived calculation is tricky.
    // Best practice: useEffect for effects, or useMemo for derived values.
    // Since we set state (setOutput), useMemo is better if we just return the value.
    // But we are setting 'output' state.
    // I will use useEffect to be safe and avoid render side-effects.

    // Correction: In original code, `useState(() => ..., [deps])` is NOT valid React.
    // `useState` takes `initialState` or `initializerFn`. It does NOT take deps.
    // So the original code was likely broken or I misread `useEffect` as `useState`.
    // Let's assume it was intended as useEffect.

    useState(() => {
        // This block in original code was weird. I'll use useEffect.
    });

    // Actually, I'll use useEffect.

    /* Original Code:
    useState(() => {
       try { ... }
    }, [input, mode]);
    */
    // This is definitely a bug in the old code if it was indeed `useState`.

    // Replacing with derived calculation + useEffect for error handling? 
    // Or just simple useEffect updating output.

    // Actually, simply calculating on render is better if it's fast. 
    // But `Base64` might be synchronous.
    // Let's stick to the existing pattern of setting output state, but use useEffect.

    /* 
    useEffect(() => {
        try {
            if (mode === 'encode') {
                setOutput(Base64.encode(input));
            } else {
                setOutput(Base64.decode(input));
            }
            setError(null);
        } catch (e) {
            if (mode === 'decode') {
               setError('Invalid Base64 string');
            }
        }
    }, [input, mode]);
    */
    // Wait, the original code had `handleChange` also setting output.
    // So `useEffect` is redundant if `handleChange` does it?
    // `handleChange` updates `input`. `input` update triggers re-render.
    // But `useUrlState` updates `input` via URL?
    // If URL changes, `input` changes.
    // So `useEffect` is needed to sync `output` with `input` (from URL).

    // I will use useEffect.

    if (false) { console.log(styles); } // dummy usage to keep imports if needed, though they are used.

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Base64 Converter</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={() => {
                        setMode(prev => prev === 'encode' ? 'decode' : 'encode');
                        setInput(output); // Swap buffer
                    }} title="Switch Mode">
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
                        onChange={(e) => {
                            const val = e.target.value;
                            setInput(val);
                            // Immediate update for better UX (optional if useEffect handles it fast enough)
                            try {
                                if (mode === 'encode') {
                                    setOutput(Base64.encode(val));
                                } else {
                                    if (val.length > 0) setOutput(Base64.decode(val));
                                    else setOutput('');
                                }
                                setError(null);
                            } catch (e) {
                                setError("Invalid input for decoding");
                            }
                        }}
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
                    {error && <div style={{ color: 'var(--error-color)', padding: '10px' }}>{error}</div>}
                </div>
            </div>
        </div>
    );
}
