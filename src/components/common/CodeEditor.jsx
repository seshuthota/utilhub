'use client';

import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // xml/html
import styles from './CodeEditor.module.css';

export default function CodeEditor({ value, onChange, language, placeholder, readOnly = false, onRun }) {

    const highlight = (code) => {
        if (!language || !Prism.languages[language]) {
            return code; // Fallback to plain text if language not loaded
        }
        return Prism.highlight(code, Prism.languages[language], language);
    };

    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            if (onRun) {
                e.preventDefault();
                onRun();
            }
        }
    };

    return (
        <div className={styles.container} onKeyDown={handleKeyDown}>
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={highlight}
                padding={20}
                placeholder={placeholder}
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    backgroundColor: 'transparent',
                    minHeight: '100%',
                }}
                textareaClassName={styles.textarea}
                readOnly={readOnly}
            />
        </div>
    );
}
