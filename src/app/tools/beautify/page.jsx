
'use client';

import { useState, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Prism Languages
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup'; // matches html/xml
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

// Formatters
import * as prettier from 'prettier/standalone';
import * as parserBabel from 'prettier/plugins/babel';
import * as parserHtml from 'prettier/plugins/html';
import * as parserPostcss from 'prettier/plugins/postcss';
import * as parserYaml from 'prettier/plugins/yaml';
import * as parserMarkdown from 'prettier/plugins/markdown';
import * as parserEstree from 'prettier/plugins/estree';

import { format as formatSql } from 'sql-formatter';
import xmlFormat from 'xml-formatter';

import { Wand2, Copy, Trash2, Minimize2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

const LANGUAGES = [
    { id: 'javascript', name: 'JavaScript', parser: 'babel', plugin: [parserBabel, parserEstree] },
    { id: 'typescript', name: 'TypeScript', parser: 'babel-ts', plugin: [parserBabel, parserEstree] },
    { id: 'html', name: 'HTML', parser: 'html', plugin: [parserHtml] },
    { id: 'css', name: 'CSS', parser: 'css', plugin: [parserPostcss] },
    { id: 'json', name: 'JSON', parser: 'json', plugin: [parserBabel, parserEstree] },
    { id: 'markdown', name: 'Markdown', parser: 'markdown', plugin: [parserMarkdown] },
    { id: 'yaml', name: 'YAML', parser: 'yaml', plugin: [parserYaml] },
    { id: 'xml', name: 'XML', parser: 'xml', plugin: [] }, // handled separately
    { id: 'sql', name: 'SQL', parser: 'sql', plugin: [] }, // handled separately
];

export default function BeautifyTool() {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const handleBeautify = async () => {
        try {
            setError(null);
            if (!code.trim()) return;

            const selectedLang = LANGUAGES.find(l => l.id === language);
            let formatted = '';

            if (language === 'sql') {
                formatted = formatSql(code);
            } else if (language === 'xml') {
                formatted = xmlFormat(code, {
                    indentation: '  ',
                    collapseContent: true,
                    lineSeparator: '\n'
                });
            } else {
                formatted = await prettier.format(code, {
                    parser: selectedLang.parser,
                    plugins: selectedLang.plugin,
                    printWidth: 80,
                    tabWidth: 2,
                    semi: true,
                    singleQuote: true,
                });
            }

            setCode(formatted);
            showToast('Code beautified successfully', 'success');
        } catch (e) {
            console.error(e);
            setError(e.message);
            showToast('Formatting failed', 'error');
        }
    };

    const handleMinify = async () => {
        try {
            setError(null);
            if (!code.trim()) return;

            let minified = '';

            // Basic minification logic (Prettier doesn't minify heavily)
            if (language === 'json') {
                minified = JSON.stringify(JSON.parse(code));
            } else if (language === 'xml') {
                minified = xmlFormat(code, { indentation: '', lineSeparator: '' });
            } else if (language === 'sql') {
                // SQL minification is tricky, just simple whitespace collapse
                minified = code.replace(/\s+/g, ' ').trim();
            } else {
                // Formatting with no whitespace is hard, simple logic:
                minified = code.replace(/\s+/g, ' ').trim();
                showToast('Basic minification applied', 'info');
            }

            if (minified) {
                setCode(minified);
                showToast('Minified successfully', 'success');
            }
        } catch (e) {
            setError(e.message);
            showToast('Minification failed', 'error');
        }
    };

    const getPrismLang = (lang) => {
        switch (lang) {
            case 'html': return Prism.languages.markup;
            case 'xml': return Prism.languages.markup;
            case 'css': return Prism.languages.css;
            case 'javascript': return Prism.languages.javascript;
            case 'typescript': return Prism.languages.typescript;
            case 'json': return Prism.languages.json;
            case 'sql': return Prism.languages.sql;
            case 'yaml': return Prism.languages.yaml;
            case 'markdown': return Prism.languages.markdown;
            default: return Prism.languages.javascript;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Code Beautifier</h1>
                <div className={styles.actions}>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={styles.select}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>

                    <button className={styles.button} onClick={handleBeautify}>
                        <Wand2 size={16} /> Beautify
                    </button>
                    <button className={styles.button} onClick={handleMinify}>
                        <Minimize2 size={16} /> Minify
                    </button>
                    <button className={styles.button} onClick={() => {
                        navigator.clipboard.writeText(code);
                        showToast('Copied to clipboard', 'success');
                    }}>
                        <Copy size={16} /> Copy
                    </button>
                    <button className={styles.button} onClick={() => setCode('')}>
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className={styles.editorWrapper}>
                <Editor
                    value={code}
                    onValueChange={setCode}
                    highlight={code => Prism.highlight(
                        code,
                        getPrismLang(language) || Prism.languages.plaintext,
                        language
                    )}
                    padding={20}
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        backgroundColor: 'transparent',
                        minHeight: '100%',
                    }}
                    placeholder={`Paste your ${language} code here...`}
                />
            </div>
        </div>
    );
}
