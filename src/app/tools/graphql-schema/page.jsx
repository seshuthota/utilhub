'use client';

import { useState, useCallback, useEffect } from 'react';
import { buildSchema, introspectionFromSchema, parse, visit, print } from 'graphql';
import { Database, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import CodeEditor from '@/components/common/CodeEditor';
import ActionToolbar from '@/components/common/ActionToolbar';
import styles from './page.module.css';

const EXAMPLE_SDL = `type Query {
  me: User
  posts: [Post]
}

type User {
  id: ID!
  username: String!
  email: String
}

type Post {
  id: ID!
  title: String!
  author: User!
  likes: Int
}

enum Status {
  DRAFT
  PUBLISHED
}`;

export default function GraphqlSchemaTool() {
    const [input, setInput] = useUrlState('sdl', '');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState('ts'); // 'ts' | 'json'
    const [error, setError] = useState(null);

    const convertToTs = (sdl) => {
        try {
            const ast = parse(sdl);
            let tsCode = '';

            // Simple mapping for scalars
            const scalarMap = {
                String: 'string',
                Int: 'number',
                Float: 'number',
                Boolean: 'boolean',
                ID: 'string',
            };

            const definitions = [];

            visit(ast, {
                ScalarTypeDefinition(node) {
                    definitions.push(`export type ${node.name.value} = any;`);
                },
                EnumTypeDefinition(node) {
                    const values = node.values.map(v => `  ${v.name.value} = "${v.name.value}"`).join(',\n');
                    definitions.push(`export enum ${node.name.value} {\n${values}\n}`);
                },
                ObjectTypeDefinition(node) {
                    const fields = node.fields.map(f => {
                        const name = f.name.value;
                        let type = f.type;
                        let isArray = false;
                        let isRequired = false;

                        // Unwrap NonNull/List logic (Basic handling)
                        // A full parser uses a recursive function, but here's a simplified one:
                        function getTypeName(t) {
                            if (t.kind === 'NonNullType') {
                                isRequired = true;
                                return getTypeName(t.type);
                            }
                            if (t.kind === 'ListType') {
                                isArray = true;
                                return getTypeName(t.type);
                            }
                            return t.name.value;
                        }

                        const baseType = getTypeName(type);
                        const tsType = scalarMap[baseType] || baseType;
                        const finalType = isArray ? `${tsType}[]` : tsType;
                        const optional = isRequired ? '' : '?';

                        return `  ${name}${optional}: ${finalType};`;
                    }).join('\n');

                    definitions.push(`export interface ${node.name.value} {\n${fields}\n}`);
                },
                InputObjectTypeDefinition(node) {
                    const fields = node.fields.map(f => {
                        const name = f.name.value;
                        // Similar simplified type logic for inputs
                        let isArray = false;
                        let isRequired = false;
                        function getTypeName(t) {
                            if (t.kind === 'NonNullType') {
                                isRequired = true;
                                return getTypeName(t.type);
                            }
                            if (t.kind === 'ListType') {
                                isArray = true;
                                return getTypeName(t.type);
                            }
                            return t.name.value;
                        }
                        const baseType = getTypeName(f.type);
                        const tsType = scalarMap[baseType] || baseType;
                        const finalType = isArray ? `${tsType}[]` : tsType;
                        const optional = isRequired ? '' : '?';

                        return `  ${name}${optional}: ${finalType};`;
                    }).join('\n');
                    definitions.push(`export interface ${node.name.value} {\n${fields}\n}`);
                }
            });

            return definitions.join('\n\n');
        } catch (e) {
            throw e;
        }
    };

    const process = useCallback((sdl, currentMode) => {
        if (!sdl.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        try {
            if (currentMode === 'json') {
                const schema = buildSchema(sdl);
                const result = introspectionFromSchema(schema);
                setOutput(JSON.stringify(result, null, 2));
            } else {
                const ts = convertToTs(sdl);
                setOutput(ts);
            }
            setError(null);
        } catch (e) {
            console.error(e);
            setOutput('');
            setError(e.message);
        }
    }, []);

    useEffect(() => {
        process(input, mode);
    }, [input, mode, process]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Database size={24} className="text-primary" />
                    <h1 className={styles.title}>GraphQL Schema Tool</h1>
                </div>
                <div>
                    <button className="btn-secondary" onClick={() => setInput(EXAMPLE_SDL)}>
                        Load Example
                    </button>
                </div>
            </header>

            <div className={styles.main}>
                <div className={styles.splitView}>
                    <div className={styles.pane}>
                        <div className={styles.paneHeader}>
                            <span>GraphQL SDL</span>
                        </div>
                        <div className={styles.editorArea}>
                            <CodeEditor
                                value={input}
                                onChange={setInput}
                                language="graphql"
                                placeholder="type Query { ... }"
                            />
                        </div>
                        {error && (
                            <div className={styles.errorInfo}>
                                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className={styles.pane}>
                        <div className={styles.paneHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>Output:</span>
                                <select
                                    className={styles.select}
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                >
                                    <option value="ts">TypeScript Interfaces</option>
                                    <option value="json">Introspection JSON</option>
                                </select>
                            </div>
                            <ActionToolbar content={output} currentToolId="graphql-schema" />
                        </div>
                        <div className={styles.editorArea}>
                            <CodeEditor
                                value={output}
                                readOnly={true}
                                language={mode === 'json' ? 'json' : 'typescript'}
                                placeholder="Output will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
