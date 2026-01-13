'use client';

import { useState } from 'react';
import { Database, Zap, Trash2, Copy } from 'lucide-react';
import { format } from 'sql-formatter';
import CodeEditor from '@/components/common/CodeEditor';
import ShareButton from '@/components/common/ShareButton';
import { useUrlState } from '@/hooks/useUrlState';
import { useToast } from '@/components/Toast';
import styles from '../markdown/page.module.css';

export default function SqlTool() {
    const [code, setCode] = useUrlState('code', 'SELECT * FROM users WHERE active = true;');
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const formatSql = () => {
        try {
            const formatted = format(code);
            setCode(formatted);
            setError(null);
            showToast('SQL formatted successfully', 'success');
        } catch (e) {
            setError(e.message);
            showToast('Invalid SQL', 'error');
        }
    };

    const cleanSql = () => {
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
                <h1 className={styles.title}>SQL Formatter</h1>
                <div className={styles.actions}>
                    <ShareButton />
                    <button className={styles.button} onClick={formatSql} title="Format (Cmd/Ctrl + Enter)">
                        <Zap size={16} /> Format
                    </button>
                    <button className={styles.button} onClick={copyToClipboard} title="Copy">
                        <Copy size={16} /> Copy
                    </button>
                    <button className={styles.button} onClick={cleanSql} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && <div className={styles.errorAlert}>Error: {error}</div>}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span>Query Editor</span>
                        <span className={styles.languageBadge}>SQL</span>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language="sql"
                            placeholder="SELECT * FROM table..."
                            onRun={formatSql}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
