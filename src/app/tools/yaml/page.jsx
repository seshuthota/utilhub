'use client';

import { useState } from 'react';
import yaml from 'js-yaml';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import { FileText, ArrowRightLeft, Copy, Trash2, Braces } from 'lucide-react';
import styles from './page.module.css';

export default function YamlTool() {
    const [input, setInput] = useState('name: UtilHub\nversion: 1.0.0\nfeatures:\n  - yaml\n  - json');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState('yaml2json'); // yaml2json | json2yaml
    const [error, setError] = useState(null);

    // Auto-convert
    useState(() => {
        convert(input, mode);
    }, [input, mode]);

    function convert(val, currentMode) {
        try {
            if (!val.trim()) {
                setOutput('');
                setError(null);
                return;
            }

            if (currentMode === 'yaml2json') {
                const obj = yaml.load(val);
                setOutput(JSON.stringify(obj, null, 2));
            } else {
                const obj = JSON.parse(val);
                setOutput(yaml.dump(obj));
            }
            setError(null);
        } catch (e) {
            setError(e.message);
        }
    }

    const handleModeToggle = () => {
        const newMode = mode === 'yaml2json' ? 'json2yaml' : 'yaml2json';
        setMode(newMode);
        setInput(output); // Swap output to input
        convert(output, newMode);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>YAML &lt;&gt; JSON Converter</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={handleModeToggle} title="Switch Mode">
                        <ArrowRightLeft size={16} /> {mode === 'yaml2json' ? 'YAML to JSON' : 'JSON to YAML'}
                    </button>
                    <button className={styles.button} onClick={() => setInput('')} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.split}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        {mode === 'yaml2json' ? 'YAML Input' : 'JSON Input'}
                    </div>
                    <div className={styles.editor}>
                        <Editor
                            value={input}
                            onValueChange={(val) => { setInput(val); convert(val, mode); }}
                            highlight={code => Prism.highlight(
                                code,
                                mode === 'yaml2json' ? Prism.languages.yaml : Prism.languages.json,
                                mode === 'yaml2json' ? 'yaml' : 'json'
                            )}
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
                    <div className={styles.paneHeader}>
                        {mode === 'yaml2json' ? 'JSON Output' : 'YAML Output'}
                        <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(output)}>
                            <Copy size={14} />
                        </button>
                    </div>
                    <div className={styles.preview}>
                        <pre className={styles.pre}>
                            <code dangerouslySetInnerHTML={{
                                __html: Prism.highlight(
                                    output,
                                    mode === 'yaml2json' ? Prism.languages.json : Prism.languages.yaml,
                                    mode === 'yaml2json' ? 'json' : 'yaml'
                                )
                            }} />
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
