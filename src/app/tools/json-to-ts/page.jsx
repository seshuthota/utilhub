'use client';

import { useState, useMemo } from 'react';
import { Copy, Braces, FileCode } from 'lucide-react';
import { useToast } from '@/components/Toast';
import CodeEditor from '@/components/common/CodeEditor';
import styles from './page.module.css';

// Convert JSON value to TypeScript type
function inferType(value, key = '', indent = 0) {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const itemTypes = [...new Set(value.map(item => inferType(item, '', indent)))];
        if (itemTypes.length === 1) {
            return `${itemTypes[0]}[]`;
        }
        return `(${itemTypes.join(' | ')})[]`;
    }
    if (typeof value === 'object') {
        return generateInterface(value, '', indent);
    }
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return Number.isInteger(value) ? 'number' : 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'any';
}

// Generate TypeScript interface from object
function generateInterface(obj, name = 'Root', indent = 0) {
    const spaces = '  '.repeat(indent);
    const innerSpaces = '  '.repeat(indent + 1);

    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return inferType(obj, '', indent);
    }

    const properties = Object.entries(obj).map(([key, value]) => {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        const type = inferType(value, key, indent + 1);

        // Handle nested objects - inline them
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return `${innerSpaces}${safeKey}: ${type};`;
        }

        return `${innerSpaces}${safeKey}: ${type};`;
    });

    if (indent === 0 && name) {
        return `interface ${name} {\n${properties.join('\n')}\n${spaces}}`;
    }

    return `{\n${properties.join('\n')}\n${spaces}}`;
}

// Main conversion function
function jsonToTypeScript(jsonString, interfaceName = 'Root') {
    try {
        const parsed = JSON.parse(jsonString);

        if (Array.isArray(parsed)) {
            if (parsed.length === 0) {
                return `type ${interfaceName} = any[];`;
            }
            const itemType = generateInterface(parsed[0], `${interfaceName}Item`, 0);
            if (itemType.startsWith('interface')) {
                return `${itemType}\n\ntype ${interfaceName} = ${interfaceName}Item[];`;
            }
            return `type ${interfaceName} = ${itemType}[];`;
        }

        return generateInterface(parsed, interfaceName, 0);
    } catch (e) {
        return `// Error: ${e.message}`;
    }
}

const sampleJson = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true,
  "roles": ["admin", "user"],
  "profile": {
    "age": 30,
    "city": "New York"
  }
}`;

export default function JsonToTsTool() {
    const [json, setJson] = useState(sampleJson);
    const [interfaceName, setInterfaceName] = useState('User');
    const { showToast } = useToast();

    const typescript = useMemo(() => {
        if (!json.trim()) return '';
        return jsonToTypeScript(json, interfaceName || 'Root');
    }, [json, interfaceName]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(typescript);
        showToast('TypeScript copied!', 'success');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JSON to TypeScript</h1>
                <p className={styles.subtitle}>Generate TypeScript interfaces from JSON data.</p>
            </header>

            <div className={styles.controls}>
                <div className={styles.nameInput}>
                    <label className={styles.label}>Interface Name</label>
                    <input
                        type="text"
                        value={interfaceName}
                        onChange={(e) => setInterfaceName(e.target.value)}
                        placeholder="Root"
                        className={styles.input}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <Braces size={16} />
                        <span>JSON Input</span>
                    </div>
                    <div className={styles.editorContainer}>
                        <CodeEditor
                            value={json}
                            onChange={(val) => setJson(val)}
                            language="json"
                            placeholder="Paste your JSON here..."
                        />
                    </div>
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <FileCode size={16} />
                        <span>TypeScript Output</span>
                        <button onClick={copyToClipboard} className={styles.copyBtn} title="Copy">
                            <Copy size={14} />
                        </button>
                    </div>
                    <div className={styles.editorContainer}>
                        <CodeEditor
                            value={typescript}
                            onChange={() => { }} // Read only
                            language="typescript" // Prism might not have typescript loaded by default, checking CodeEditor
                            readOnly={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
