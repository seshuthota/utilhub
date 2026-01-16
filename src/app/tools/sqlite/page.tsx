'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Database,
    Upload,
    Download,
    Play,
    Zap,
    Table,
    History,
    Copy,
    FileJson,
    FileSpreadsheet,
    Trash2,
    AlertCircle,
    CheckCircle2,
    HardDrive,
} from 'lucide-react';
import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import { format } from 'sql-formatter';

import CodeEditor from '@/components/common/CodeEditor';
import ShareButton from '@/components/common/ShareButton';
import { useUrlState } from '@/hooks/useUrlState';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from '@/components/Toast';

import styles from './page.module.css';

interface QueryResult {
    columns: string[];
    values: any[][];
}

interface TableSchema {
    name: string;
    columns: { name: string; type: string; pk: boolean }[];
}

interface HistoryItem {
    query: string;
    timestamp: string;
    status: 'success' | 'error';
    rowCount?: number;
}

export default function SqliteTool() {
    const [code, setCode] = useUrlState('code', 'SELECT sqlite_version();');
    const [sqlJs, setSqlJs] = useState<SqlJsStatic | null>(null);
    const [db, setDb] = useState<SqlJsDatabase | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<QueryResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'results' | 'schema' | 'history'>('results');
    const [schema, setSchema] = useState<TableSchema[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [dbName, setDbName] = useState<string>('memory');
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    // Initialize sql.js
    useEffect(() => {
        const loadSqlJs = async () => {
            try {
                const SQL = await initSqlJs({
                    locateFile: (file) => `https://sql.js.org/dist/${file}`,
                });
                setSqlJs(SQL);
                const newDb = new SQL.Database();
                setDb(newDb);
                setIsLoading(false);
                refreshSchema(newDb);
            } catch (e: any) {
                setError(`Failed to load SQLite: ${e.message}`);
                setIsLoading(false);
            }
        };
        loadSqlJs();

        return () => {
            db?.close();
        };
    }, []);

    const refreshSchema = useCallback((database: SqlJsDatabase) => {
        try {
            const tables = database.exec(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            );
            if (tables.length === 0 || tables[0].values.length === 0) {
                setSchema([]);
                return;
            }

            const schemaData: TableSchema[] = [];
            for (const row of tables[0].values) {
                const tableName = row[0] as string;
                const columnsResult = database.exec(`PRAGMA table_info("${tableName}")`);
                if (columnsResult.length > 0) {
                    const columns = columnsResult[0].values.map((col) => ({
                        name: col[1] as string,
                        type: col[2] as string || 'TEXT',
                        pk: col[5] === 1,
                    }));
                    schemaData.push({ name: tableName, columns });
                }
            }
            setSchema(schemaData);
        } catch (e) {
            console.error('Schema refresh error:', e);
        }
    }, []);

    const runQuery = useCallback((queryToRun = code, addToHistory = true) => {
        if (!db) {
            setError('Database not initialized');
            return;
        }

        try {
            const results = db.exec(queryToRun);
            setResult(results as QueryResult[]);
            setError(null);
            refreshSchema(db);

            const rowCount = results.length > 0 ? results[0].values.length : 0;

            if (addToHistory && queryToRun.trim()) {
                setHistory((prev) => [
                    {
                        query: queryToRun,
                        timestamp: new Date().toLocaleTimeString(),
                        status: 'success',
                        rowCount,
                    },
                    ...prev.slice(0, 49),
                ]);
            }

            showToast(`Query executed (${rowCount} rows)`, 'success');
        } catch (e: any) {
            setError(e.message);
            setResult(null);

            if (addToHistory && queryToRun.trim()) {
                setHistory((prev) => [
                    {
                        query: queryToRun,
                        timestamp: new Date().toLocaleTimeString(),
                        status: 'error',
                    },
                    ...prev.slice(0, 49),
                ]);
            }

            showToast('Query failed', 'error');
        }
    }, [db, code, refreshSchema, showToast]);

    const formatSql = () => {
        try {
            const formatted = format(code, { language: 'sqlite' });
            setCode(formatted);
            showToast('SQL formatted', 'success');
        } catch (e: any) {
            showToast('Format failed', 'error');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        showToast('Copied to clipboard', 'success');
    };

    const handleFileUpload = async (file: File) => {
        if (!sqlJs) {
            showToast('SQLite not ready', 'error');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const data = new Uint8Array(buffer);
            db?.close();
            const newDb = new sqlJs.Database(data);
            setDb(newDb);
            setDbName(file.name);
            refreshSchema(newDb);
            setResult(null);
            setError(null);
            showToast(`Loaded ${file.name}`, 'success');
        } catch (e: any) {
            showToast(`Failed to load file: ${e.message}`, 'error');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.sqlite') || file.name.endsWith('.db') || file.name.endsWith('.sqlite3'))) {
            handleFileUpload(file);
        } else {
            showToast('Please drop a .sqlite or .db file', 'error');
        }
    }, [sqlJs, showToast]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const exportDatabase = () => {
        if (!db) return;
        try {
            const data = db.export();
            // Create a proper ArrayBuffer copy for Blob compatibility
            const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
            const blob = new Blob([arrayBuffer], { type: 'application/x-sqlite3' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = dbName.endsWith('.sqlite') || dbName.endsWith('.db') ? dbName : `${dbName}.sqlite`;
            link.click();
            URL.revokeObjectURL(url);
            showToast('Database exported', 'success');
        } catch (e: any) {
            showToast(`Export failed: ${e.message}`, 'error');
        }
    };

    const exportAsJson = () => {
        if (!result || result.length === 0) return;
        const data = result[0].values.map((row) => {
            const obj: Record<string, any> = {};
            result[0].columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'query_results.json';
        link.click();
        URL.revokeObjectURL(url);
        showToast('Exported as JSON', 'success');
    };

    const exportAsCsv = () => {
        if (!result || result.length === 0) return;
        const headers = result[0].columns.join(',');
        const rows = result[0].values.map((row) =>
            row.map((val) => (typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val)).join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'query_results.csv';
        link.click();
        URL.revokeObjectURL(url);
        showToast('Exported as CSV', 'success');
    };

    const createNewDb = () => {
        if (!sqlJs) return;
        db?.close();
        const newDb = new sqlJs.Database();
        setDb(newDb);
        setDbName('memory');
        setResult(null);
        setError(null);
        setSchema([]);
        showToast('New database created', 'success');
    };

    // Keyboard shortcuts
    useHotkeys('Enter', () => runQuery(), { meta: true });
    useHotkeys('f', formatSql, { meta: true, shift: true });
    useHotkeys('c', copyToClipboard, { meta: true, shift: true });

    if (isLoading) {
        return (
            <div className={styles.loadingOverlay}>
                <div className={styles.loadingCard}>
                    <div className={styles.spinner} />
                    <p>Loading SQLite WebAssembly...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    SQLite Studio
                    <span className={styles.wasmBadge}>Wasm</span>
                </h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={createNewDb} title="New Database">
                        <Trash2 size={16} /> New
                    </button>
                    <button className={styles.button} onClick={() => fileInputRef.current?.click()} title="Upload DB">
                        <Upload size={16} /> Upload
                    </button>
                    <button className={styles.button} onClick={exportDatabase} disabled={!db} title="Export Database">
                        <Download size={16} /> Export DB
                    </button>
                    <button className={styles.button} onClick={copyToClipboard} title="Copy SQL">
                        <Copy size={16} />
                    </button>
                    <ShareButton />
                </div>
            </header>

            <input
                ref={fileInputRef}
                type="file"
                accept=".sqlite,.db,.sqlite3"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
            />

            {/* Drop Zone */}
            <div
                className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className={styles.dropZoneContent}>
                    <HardDrive size={32} />
                    <span>Drop a .sqlite or .db file here, or click to browse</span>
                </div>
            </div>

            {/* DB Info */}
            <div className={styles.dbInfo}>
                <div className={styles.dbInfoItem}>
                    <Database size={16} />
                    <strong>Database:</strong> {dbName}
                </div>
                <div className={styles.dbInfoItem}>
                    <Table size={16} />
                    <strong>Tables:</strong> {schema.length}
                </div>
            </div>

            {/* Query Editor */}
            <div className={styles.editorPane}>
                <div className={styles.paneHeader}>
                    <span>Query Editor</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={formatSql} className={styles.button} title="Format SQL (⌘+Shift+F)">
                            <Zap size={14} /> Format
                        </button>
                        <button onClick={() => runQuery()} className={styles.primaryBtn} title="Run Query (⌘+Enter)">
                            <Play size={14} /> Run
                        </button>
                    </div>
                </div>
                <div className={styles.editorWrapper}>
                    <CodeEditor
                        value={code}
                        onChange={setCode}
                        language="sql"
                        placeholder="SELECT * FROM table_name..."
                        onRun={() => runQuery()}
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Results / Schema / History Tabs */}
            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'results' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('results')}
                    >
                        <Table size={16} /> Results
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'schema' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('schema')}
                    >
                        <Database size={16} /> Schema
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History size={16} /> History
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'results' && (
                        <>
                            {result && result.length > 0 ? (
                                <>
                                    <div className={styles.resultStats}>
                                        <div className={styles.statsInfo}>
                                            <span className={styles.statsCount}>{result[0].values.length}</span> rows
                                            <span style={{ margin: '0 0.25rem' }}>•</span>
                                            <span className={styles.statsCount}>{result[0].columns.length}</span> columns
                                        </div>
                                        <div className={styles.exportButtons}>
                                            <button onClick={exportAsJson} className={`${styles.exportBtn} ${styles.exportBtnJson}`}>
                                                <FileJson size={14} /> JSON
                                            </button>
                                            <button onClick={exportAsCsv} className={`${styles.exportBtn} ${styles.exportBtnCsv}`}>
                                                <FileSpreadsheet size={14} /> CSV
                                            </button>
                                        </div>
                                    </div>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                {result[0].columns.map((col, i) => (
                                                    <th key={i}>{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result[0].values.map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((val, j) => (
                                                        <td key={j}>{val === null ? <em style={{ opacity: 0.5 }}>NULL</em> : String(val)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : (
                                <div className={styles.emptyState}>
                                    <Table size={48} />
                                    <p>Run a query to see results</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'schema' && (
                        <>
                            {schema.length > 0 ? (
                                <div className={styles.schemaGrid}>
                                    {schema.map((table) => (
                                        <div key={table.name} className={styles.schemaCard}>
                                            <h4>
                                                <Table size={16} /> {table.name}
                                            </h4>
                                            <div className={styles.schemaColumns}>
                                                {table.columns.map((col) => (
                                                    <div key={col.name} className={styles.schemaColumn}>
                                                        <span className={styles.columnName}>
                                                            {col.pk ? '🔑 ' : ''}{col.name}
                                                        </span>
                                                        <span className={styles.columnType}>{col.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <Database size={48} />
                                    <p>No tables yet. Create one!</p>
                                    <code style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)
                                    </code>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'history' && (
                        <>
                            {history.length > 0 ? (
                                history.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.historyItem} ${item.status === 'success' ? styles.historySuccess : styles.historyError}`}
                                        onClick={() => setCode(item.query)}
                                    >
                                        <div className={styles.historyQuery}>{item.query}</div>
                                        <div className={styles.historyTime}>
                                            {item.timestamp}
                                            {item.rowCount !== undefined && ` • ${item.rowCount} rows`}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <History size={48} />
                                    <p>No query history yet</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
