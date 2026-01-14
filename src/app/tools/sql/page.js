
'use client';

import { useState, useEffect } from 'react';
import { Database, Zap, Trash2, Copy, Play, Table, History, RotateCcw } from 'lucide-react';


import { format } from 'sql-formatter';
import alasql from 'alasql';
import CodeEditor from '@/components/common/CodeEditor';
import ShareButton from '@/components/common/ShareButton';
import AiAssistButton from '@/components/common/AiAssistButton';
import { useUrlState } from '@/hooks/useUrlState';
import { useToast } from '@/components/Toast';
import styles from '../markdown/page.module.css';

// Initialize Alasql with some dummy data
const initDb = () => {
    alasql('CREATE TABLE IF NOT EXISTS users (id INT, name STRING, email STRING, role STRING)');
    alasql('DELETE FROM users');
    alasql('INSERT INTO users VALUES (1, "Alice", "alice@example.com", "admin")');
    alasql('INSERT INTO users VALUES (2, "Bob", "bob@example.com", "user")');
    alasql('INSERT INTO users VALUES (3, "Charlie", "charlie@example.com", "user")');

    alasql('CREATE TABLE IF NOT EXISTS products (id INT, name STRING, price MONEY, stock INT)');
    alasql('DELETE FROM products');
    alasql('INSERT INTO products VALUES (1, "Laptop", 999.99, 10)');
    alasql('INSERT INTO products VALUES (2, "Mouse", 29.99, 100)');
    alasql('INSERT INTO products VALUES (3, "Keyboard", 59.99, 50)');

    alasql('CREATE TABLE IF NOT EXISTS orders (id INT, user_id INT, product_id INT, date DATE)');
    alasql('DELETE FROM orders');
    alasql('INSERT INTO orders VALUES (1, 1, 1, "2023-01-01")');
    alasql('INSERT INTO orders VALUES (2, 2, 2, "2023-01-02")');
};

export default function SqlTool() {
    const [code, setCode] = useUrlState('code', 'SELECT * FROM users;');
    const [aiPrompt, setAiPrompt] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('results'); // results, schema, history
    const [history, setHistory] = useState([]);

    const { showToast } = useToast();

    // Init DB on load
    useEffect(() => {
        try {
            initDb();
            // Auto-run initial query
            runQuery(code, false);
        } catch (e) {
            console.error("Failed to init DB", e);
        }
    }, []);

    const runQuery = (queryToRun = code, addToHistory = true) => {
        try {
            // Support multiple statements? Alasql supports it but returns array.
            // Let's handle single result for simplicity or last result.
            const res = alasql(queryToRun);
            setResult(res);
            setError(null);

            if (addToHistory && queryToRun.trim()) {
                setHistory(prev => [
                    { query: queryToRun, timestamp: new Date().toLocaleTimeString(), status: 'success' },
                    ...prev.slice(0, 19) // Keep last 20
                ]);
            }

            showToast('Query executed successfully', 'success');
            // If valid SQL, also format it to look nice (optional, maybe distracting)
            // setCode(format(queryToRun)); 
        } catch (e) {
            setError(e.message);
            setResult(null);
            if (addToHistory && queryToRun.trim()) {
                setHistory(prev => [
                    { query: queryToRun, timestamp: new Date().toLocaleTimeString(), status: 'error' },
                    ...prev.slice(0, 19)
                ]);
            }
            showToast('Query failed', 'error');
        }
    };

    const handleAiResult = (response) => {
        const cleaned = response.trim().replace(/^```sql\n?|```javascript\n?|```\n?|```$/g, '');
        setCode(cleaned);
        try {
            const formatted = format(cleaned);
            setCode(formatted);
        } catch (e) {
            // Ignore format error
        }
    };

    const formatSql = () => {
        try {
            const formatted = format(code);
            setCode(formatted);
            showToast('SQL formatted', 'success');
        } catch (e) {
            setError(e.message);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        showToast('Copied to clipboard', 'success');
    };

    const resetDb = () => {
        initDb();
        showToast('Database reset to initial state', 'success');
        runQuery('SELECT * FROM users', false);
        setCode('SELECT * FROM users');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>SQL Playground</h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={resetDb} title="Reset DB Data">
                        <RotateCcw size={16} /> Reset DB
                    </button>
                    <ShareButton />
                    <button className={styles.button} onClick={copyToClipboard} title="Copy">
                        <Copy size={16} />
                    </button>
                </div>
            </header>

            {/* AI Assist */}
            <div className={styles.aiSection} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '8px' }}>
                    <input
                        className={styles.aiInput}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ask AI to write a query (e.g. 'Show products under $100')"
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)' }}
                    />
                    <AiAssistButton
                        prompt={`Given tables: users(id, name, email, role), products(id, name, price, stock), orders(id, user_id, product_id, date). Write a standard SQL query for: "${aiPrompt}". Return ONLY sql.`}
                        onResult={handleAiResult}
                        disabled={!aiPrompt.trim()}
                    />
                </div>
            </div>

            <div className={styles.editorContainer} style={{ flexDirection: 'column', height: 'auto', gap: '1rem' }}>

                {/* Editor & Actions */}
                <div className={styles.pane} style={{ minHeight: '200px' }}>
                    <div className={styles.paneHeader}>
                        <span>Query Editor</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={formatSql} className={styles.actionBtn} title="Format SQL">
                                <Zap size={14} /> Format
                            </button>
                            <button onClick={() => runQuery()} className={styles.primaryBtn} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                                <Play size={14} /> Run
                            </button>
                        </div>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language="sql"
                            placeholder="SELECT * FROM users..."
                            onRun={() => runQuery()}
                        />
                    </div>
                </div>

                {/* Results / Schema / History Tabs */}
                <div className={styles.pane} style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.paneHeader} style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                        <button
                            onClick={() => setActiveTab('results')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'results' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'results' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            <Table size={14} /> Results
                        </button>
                        <button
                            onClick={() => setActiveTab('schema')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'schema' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'schema' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            <Database size={14} /> Schema
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            <History size={14} /> History
                        </button>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', padding: '1rem', background: 'var(--bg-secondary)' }}>
                        {error && <div className={styles.errorAlert} style={{ marginBottom: '1rem' }}>{error}</div>}

                        {activeTab === 'results' && (
                            <>
                                {Array.isArray(result) && result.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr>
                                                {Object.keys(result[0]).map(key => (
                                                    <th key={key} style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((val, j) => (
                                                        <td key={j} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{String(val)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    !error && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No results or empty set</div>
                                )}
                            </>
                        )}

                        {activeTab === 'schema' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>users</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div>id (INT)</div>
                                        <div>name (STRING)</div>
                                        <div>email (STRING)</div>
                                        <div>role (STRING)</div>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>products</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div>id (INT)</div>
                                        <div>name (STRING)</div>
                                        <div>price (MONEY)</div>
                                        <div>stock (INT)</div>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>orders</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div>id (INT)</div>
                                        <div>user_id (INT)</div>
                                        <div>product_id (INT)</div>
                                        <div>date (DATE)</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {history.map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCode(item.query)}
                                        style={{
                                            padding: '0.75rem',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: '1px solid var(--border-color)',
                                            borderLeft: item.status === 'error' ? '3px solid red' : '3px solid green'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.query}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {item.timestamp}
                                        </div>
                                    </div>
                                ))}
                                {history.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No history yet</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
