'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import { Wand2, Copy, Trash2, Minimize2 } from 'lucide-react';
import styles from './page.module.css';

const defaultCode = `<!DOCTYPE html>
<html><head><title>Test</title><style>body{margin:0;padding:20px;}</style></head><body><div class="container"><h1>Hello World</h1></div><script>console.log('hello');</script></body></html>`;

export default function BeautifyTool() {
    const [code, setCode] = useState(defaultCode);
    const [language, setLanguage] = useState('html');

    // Simple beautification functions (no external deps for basic formatting)
    function beautify(input, lang) {
        try {
            if (lang === 'html') {
                return beautifyHTML(input);
            } else if (lang === 'css') {
                return beautifyCSS(input);
            } else if (lang === 'javascript') {
                return beautifyJS(input);
            }
            return input;
        } catch (e) {
            return input;
        }
    }

    function beautifyHTML(str) {
        let formatted = '';
        let indent = 0;
        str.split(/(<[^>]+>)/g).forEach(token => {
            if (token.match(/^<\//)) {
                indent--;
            }
            if (token.trim()) {
                formatted += '  '.repeat(Math.max(0, indent)) + token.trim() + '\n';
            }
            if (token.match(/^<[^\/!][^>]*[^\/]>$/) && !token.match(/^<(br|hr|img|input|meta|link)/i)) {
                indent++;
            }
        });
        return formatted.trim();
    }

    function beautifyCSS(str) {
        return str
            .replace(/\s*{\s*/g, ' {\n  ')
            .replace(/;\s*/g, ';\n  ')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    function beautifyJS(str) {
        return str
            .replace(/;(?!\n)/g, ';\n')
            .replace(/{(?!\n)/g, '{\n  ')
            .replace(/}(?!\n)/g, '\n}')
            .trim();
    }

    function minify(input) {
        return input.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    }

    const getLang = () => {
        if (language === 'html') return Prism.languages.markup;
        if (language === 'css') return Prism.languages.css;
        return Prism.languages.javascript;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Code Beautifier</h1>
                <div className={styles.actions}>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className={styles.select}>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="javascript">JavaScript</option>
                    </select>
                    <button className={styles.button} onClick={() => setCode(beautify(code, language))}>
                        <Wand2 size={16} /> Beautify
                    </button>
                    <button className={styles.button} onClick={() => setCode(minify(code))}>
                        <Minimize2 size={16} /> Minify
                    </button>
                    <button className={styles.button} onClick={() => navigator.clipboard.writeText(code)}>
                        <Copy size={16} /> Copy
                    </button>
                </div>
            </header>

            <div className={styles.editorWrapper}>
                <Editor
                    value={code}
                    onValueChange={setCode}
                    highlight={code => Prism.highlight(code, getLang(), language)}
                    padding={20}
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        backgroundColor: 'transparent',
                        minHeight: '100%',
                    }}
                />
            </div>
        </div>
    );
}
