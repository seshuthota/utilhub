'use client';

import { useState } from 'react';
import { Braces, Copy, Trash2, Maximize, Minimize } from 'lucide-react';
import CodeEditor from '@/components/common/CodeEditor';
import { useToast } from '@/components/Toast';
import styles from '../markdown/page.module.css';

export default function JsonTool() {
    const [code, setCode] = useState('{"name":"UtilHub","type":"Project","active":true}');
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const formatJson = () => {
        try {
            const parsed = JSON.parse(code);
            setCode(JSON.stringify(parsed, null, 2));
            setError(null);
            showToast('JSON formatted successfully', 'success');
        } catch (e) {
            setError(e.message);
            showToast('Invalid JSON', 'error');
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(code);
            setCode(JSON.stringify(parsed));
            setError(null);
            showToast('JSON minified successfully', 'success');
        } catch (e) {
            setError(e.message);
            showToast('Invalid JSON', 'error');
        }
    };

    const cleanJson = () => {
        setCode('');
        setError(null);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        showToast('Copied to clipboard', 'success');
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
                    <button className={styles.button} onClick={copyToClipboard} title="Copy">
                        <Copy size={16} /> Copy
                    </button>
                    <button className={styles.button} onClick={cleanJson} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && <div className={styles.errorAlert}>Error: {error}</div>}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span>Input / Output</span>
                        <span className={styles.languageBadge}>JSON</span>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={code}
                            onChange={code => setCode(code)}
                            language="json"
                            placeholder="Paste your JSON here..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
