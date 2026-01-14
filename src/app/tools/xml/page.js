'use client';

import { useState } from 'react';
import xmlFormat from 'xml-formatter';

import { FileCode, Copy, Trash2, Zap, Minimize, Braces } from 'lucide-react';
import CodeEditor from '@/components/common/CodeEditor';
import { useToast } from '@/components/Toast';
import styles from '../markdown/page.module.css';

export default function XmlTool() {
    const [code, setCode] = useState('<root><child id="1">Hello World</child></root>');
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const handleFormat = () => {
        try {
            const formatted = xmlFormat(code, {
                indentation: '  ',
                filter: (node) => node.type !== 'Comment',
                collapseContent: true,
                lineSeparator: '\n'
            });
            setCode(formatted);
            setError(null);
            showToast('XML formatted successfully', 'success');
        } catch (e) {
            setError("Invalid XML: " + e.message);
            showToast('Invalid XML', 'error');
        }
    };

    const handleMinify = () => {
        try {
            const minified = xmlFormat(code, { indentation: '', lineSeparator: '' });
            setCode(minified);
            setError(null);
            showToast('XML minified successfully', 'success');
        } catch (e) {
            setError("Invalid XML: " + e.message);
            showToast('Invalid XML', 'error');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        showToast('Copied to clipboard', 'success');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>XML Formatter</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={handleFormat} title="Format (Cmd/Ctrl + Enter)">
                        <Braces size={16} /> Format
                    </button>
                    <button className={styles.button} onClick={handleMinify} title="Minify XML">
                        <Minimize size={16} /> Minify
                    </button>
                    <button className={styles.button} onClick={handleCopy} title="Copy">
                        <Copy size={16} /> Copy
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
                        <span>XML Content</span>
                        <span className={styles.languageBadge}>XML</span>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language="markup"
                            placeholder="<root>...</root>"
                            onRun={handleFormat}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
