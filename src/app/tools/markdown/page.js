'use client';

import { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup'; // Needed for markdown
import 'prismjs/components/prism-markdown';
import { marked } from 'marked';
import { Copy, Download, Trash2 } from 'lucide-react';
import styles from './page.module.css';

// Manual Prism Theme for Monochrome (overriding default prism CSS if any, or just supplying styles)
// We will inject styles via global CSS or styled-jsx, but simplest is to handle highlighting classes in globals.css
// However, react-simple-code-editor output just has classes.

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
    const [html, setHtml] = useState('');

    useEffect(() => {
        // Sanitize can be added here if needed, but for local tool it's fine.
        // marked parses sync by default.
        setHtml(marked.parse(code));
    }, [code]);

    const handleCopy = () => {
        navigator.clipboard.writeText(html);
        // Could add toast here
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
                <div className={`${styles.pane} ${styles.editorPane}`}>
                    <div className={styles.paneHeader}>Editor (Markdown)</div>
                    <div className={styles.editor}>
                        <Editor
                            value={code}
                            onValueChange={code => setCode(code)}
                            highlight={code => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
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

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>Preview</div>
                    <div
                        className={styles.preview}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>
            </div>
        </div>
    );
}
