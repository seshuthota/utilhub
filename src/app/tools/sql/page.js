'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import { format } from 'sql-formatter';
import { Database, Copy, Trash2, Zap } from 'lucide-react';
import styles from '../markdown/page.module.css'; // Reuse split pane styles

export default function SqlTool() {
    const [code, setCode] = useState('SELECT * FROM users WHERE id = 1');
    const [error, setError] = useState(null);

    const handleFormat = () => {
        try {
            const formatted = format(code, { language: 'sql', tabWidth: 2, keywordCase: 'upper' });
            setCode(formatted);
            setError(null);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>SQL Formatter</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={handleFormat} title="Format SQL">
                        <Zap size={16} /> Format
                    </button>
                    <button className={styles.button} onClick={handleCopy} title="Copy">
                        <Copy size={16} /> Copy
                    </button>
                    <button className={styles.button} onClick={() => setCode('')} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && <div style={{ color: '#ff4444', marginBottom: '1rem' }}>{error}</div>}

            <div className={styles.editorContainer}>
                <div className={`${styles.pane} ${styles.editorPane}`}>
                    <div className={styles.paneHeader}>SQL Query</div>
                    <div className={styles.editor}>
                        <Editor
                            value={code}
                            onValueChange={setCode}
                            highlight={code => Prism.highlight(code, Prism.languages.sql, 'sql')}
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
