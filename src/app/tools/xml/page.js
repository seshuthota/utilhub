'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-xml-doc';
import xmlFormat from 'xml-formatter';
import { FileCode, Copy, Trash2, Zap, Minimize } from 'lucide-react';
import styles from '../markdown/page.module.css';

export default function XmlTool() {
    const [code, setCode] = useState('<root><child id="1">Hello World</child></root>');
    const [error, setError] = useState(null);

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
        } catch (e) {
            setError("Invalid XML: " + e.message);
        }
    };

    const handleMinify = () => {
        try {
            const minified = xmlFormat(code, { indentation: '', lineSeparator: '' });
            setCode(minified);
            setError(null);
        } catch (e) {
            setError("Invalid XML: " + e.message);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>XML Formatter</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={handleFormat} title="Format XML">
                        <Zap size={16} /> Format
                    </button>
                    <button className={styles.button} onClick={handleMinify} title="Minify XML">
                        <Minimize size={16} /> Minify
                    </button>
                    <button className={styles.button} onClick={() => navigator.clipboard.writeText(code)} title="Copy">
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
                    <div className={styles.paneHeader}>XML Content</div>
                    <div className={styles.editor}>
                        <Editor
                            value={code}
                            onValueChange={setCode}
                            highlight={code => Prism.highlight(code, Prism.languages.xml || Prism.languages.markup, 'xml')}
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
