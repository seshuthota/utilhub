'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { Braces, Copy, Trash2, CheckCircle, AlertTriangle, Minimize, Maximize } from 'lucide-react';
import styles from '../markdown/page.module.css'; // Reusing layout styles

export default function JsonTool() {
    const [code, setCode] = useState('{"name":"UtilHub","type":"Project","active":true}');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const formatJson = () => {
        try {
            const parsed = JSON.parse(code);
            setCode(JSON.stringify(parsed, null, 2));
            setError(null);
            setSuccess('Formatted successfully');
            setTimeout(() => setSuccess(null), 2000);
        } catch (e) {
            setError(e.message);
            setSuccess(null);
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(code);
            setCode(JSON.stringify(parsed));
            setError(null);
            setSuccess('Minified successfully');
            setTimeout(() => setSuccess(null), 2000);
        } catch (e) {
            setError(e.message);
            setSuccess(null);
        }
    };

    const cleanJson = () => {
        setCode('');
        setError(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JSON Formatter</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={formatJson} title="Prettify">
                        <Maximize size={16} /> Format
                    </button>
                    <button className={styles.button} onClick={minifyJson} title="Minify">
                        <Minimize size={16} /> Minify
                    </button>
                    <button className={styles.button} onClick={cleanJson} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && <div style={{ color: '#ff4444', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ff4444', borderRadius: '4px', background: 'rgba(255,0,0,0.1)' }}>Error: {error}</div>}
            {success && <div style={{ color: '#00cc66', marginBottom: '1rem' }}>{success}</div>}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>JSON Editor</div>
                    <div className={styles.editor}>
                        <Editor
                            value={code}
                            onValueChange={code => setCode(code)}
                            highlight={code => Prism.highlight(code, Prism.languages.json, 'json')}
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
            </div>
        </div>
    );
}
