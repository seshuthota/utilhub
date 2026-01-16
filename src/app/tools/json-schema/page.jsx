'use client';

import { useState, useMemo } from 'react';
import Ajv from 'ajv';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import AiAssistBar from '@/components/common/AiAssistBar';
import styles from './page.module.css';

const ajv = new Ajv({ allErrors: true });

const defaultSchema = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"]
}`;

const defaultData = `{
  "name": "John Doe",
  "age": 30
}`;

export default function JsonSchemaTool() {
    const [schema, setSchema] = useState(defaultSchema);
    const [data, setData] = useState(defaultData);
    const [aiPrompt, setAiPrompt] = useState('');

    const handleAiResult = (response) => {
        const cleaned = response.trim().replace(/^```json\n?|```javascript\n?|```\n?|```$/g, '');
        try {
            const parsed = JSON.parse(cleaned);
            setSchema(JSON.stringify(parsed, null, 2));
        } catch (e) {
            setSchema(cleaned);
        }
    };

    const result = useMemo(() => {
        try {
            const schemaObj = JSON.parse(schema);
            const dataObj = JSON.parse(data);

            const validate = ajv.compile(schemaObj);
            const valid = validate(dataObj);

            return {
                valid,
                errors: validate.errors || [],
                parseError: null
            };
        } catch (e) {
            return {
                valid: false,
                errors: [],
                parseError: e.message
            };
        }
    }, [schema, data]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JSON Schema Validator</h1>
                <div className={styles.status}>
                    {result.parseError ? (
                        <span className={styles.parseError}><AlertTriangle size={16} /> Parse Error</span>
                    ) : result.valid ? (
                        <span className={styles.valid}><CheckCircle size={16} /> Valid</span>
                    ) : (
                        <span className={styles.invalid}><XCircle size={16} /> Invalid</span>
                    )}
                </div>
            </header>

            {/* AI Assist Section */}
            <AiAssistBar
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
                type="json-schema"
                payload={{ data, schema }} // description is added by AiAssistBar
                onResult={handleAiResult}
                placeholder="e.g., 'generate schema from this data', 'add a required email field', 'make age optional'"
            />

            <div className={styles.grid}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>JSON Schema</div>
                    <div className={styles.editor}>
                        <Editor
                            value={schema}
                            onValueChange={setSchema}
                            highlight={code => Prism.highlight(code, Prism.languages.json, 'json')}
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

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>JSON Data</div>
                    <div className={styles.editor}>
                        <Editor
                            value={data}
                            onValueChange={setData}
                            highlight={code => Prism.highlight(code, Prism.languages.json, 'json')}
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
            </div>

            {(result.parseError || result.errors.length > 0) && (
                <div className={styles.errorPanel}>
                    <h3>Errors</h3>
                    {result.parseError && <div className={styles.errorItem}>{result.parseError}</div>}
                    {result.errors.map((err, i) => (
                        <div key={i} className={styles.errorItem}>
                            <strong>{err.instancePath || '/'}</strong>: {err.message}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
