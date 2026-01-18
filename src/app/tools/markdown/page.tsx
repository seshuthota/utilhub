'use client';

import { useState, useEffect } from 'react';
// @ts-ignore
import { marked } from 'marked';
import { Copy, Trash2 } from 'lucide-react';
import CodeMirrorEditor from '@/components/common/CodeMirrorEditor';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

const defaultMarkdown = `# Welcome to Markdown Viewer

This is a **live preview** editor. 

## Features
- Syntax Highlighting
- Real-time conversion
- Clean, monochrome design

\`\`\`javascript
console.log("Hello UtilHub!");
\`\`\`
`;

export default function MarkdownTool() {
    const [code, setCode] = useState(defaultMarkdown);
    const [html, setHtml] = useState<string | Promise<string>>('');
    const { showToast } = useToast();

    useEffect(() => {
        const parsed = marked.parse(code);
        setHtml(parsed);
    }, [code]);

    const handleCopy = () => {
        if (typeof html === 'string') {
            navigator.clipboard.writeText(html);
            showToast('HTML copied to clipboard', 'success');
        }
    };

    const handleClear = () => {
        setCode('');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Markdown Viewer</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={handleClear} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                    <button className={styles.button} onClick={handleCopy} title="Copy HTML">
                        <Copy size={16} /> Copy HTML
                    </button>
                </div>
            </header>

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span>Editor</span>
                        <span className={styles.languageBadge}>Markdown</span>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeMirrorEditor
                            value={code}
                            onChange={setCode}
                            language="markdown"
                            placeholder="# Type markdown here..."
                        />
                    </div>
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>Preview</div>
                    <div
                        className={styles.preview}
                        dangerouslySetInnerHTML={{ __html: typeof html === 'string' ? html : '' }}
                    />
                </div>
            </div>
        </div>
    );
}
