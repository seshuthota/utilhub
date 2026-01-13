
'use client';

import { useState, useEffect } from 'react';
import { Send, Copy, Trash2, Plus, X, Clock, Database, Globe } from 'lucide-react';
import styles from './page.module.css';

export default function ApiTesterTool() {
    // Request State
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
    const [params, setParams] = useState([]); // [{ key, value, active }]
    const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json', active: true }]);
    const [auth, setAuth] = useState({ type: 'none', username: '', password: '', token: '' });
    const [body, setBody] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState('params');
    const [responseTab, setResponseTab] = useState('body');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    // Sync URL params on load
    useEffect(() => {
        try {
            const urlObj = new URL(url);
            const newParams = [];
            urlObj.searchParams.forEach((value, key) => {
                newParams.push({ key, value, active: true });
            });
            if (newParams.length > 0) setParams(newParams);
        } catch (e) {
            // Invalid URL, ignore
        }
    }, []);

    const updateUrl = (newUrl) => {
        setUrl(newUrl);
        try {
            const urlObj = new URL(newUrl);
            const newParams = [];
            urlObj.searchParams.forEach((value, key) => {
                newParams.push({ key, value, active: true });
            });
            setParams(newParams);
        } catch (e) {
            // Invalid URL, don't update params yet
        }
    };

    const updateParams = (newParams) => {
        setParams(newParams);
        try {
            // Only update URL if it's valid
            if (!url) return;
            const urlObj = new URL(url); // Use current base URL

            // Clear existing search params
            const keys = Array.from(urlObj.searchParams.keys());
            keys.forEach(key => urlObj.searchParams.delete(key));

            // Add new active params
            newParams.forEach(p => {
                if (p.active && p.key) {
                    urlObj.searchParams.append(p.key, p.value);
                }
            });

            setUrl(urlObj.toString());
        } catch (e) {
            // URL might be incomplete
        }
    };

    const addParam = () => setParams([...params, { key: '', value: '', active: true }]);
    const removeParam = (idx) => updateParams(params.filter((_, i) => i !== idx));
    const updateParamField = (idx, field, value) => {
        const newParams = [...params];
        newParams[idx][field] = value;
        updateParams(newParams);
    };

    const addHeader = () => setHeaders([...headers, { key: '', value: '', active: true }]);
    const removeHeader = (idx) => setHeaders(headers.filter((_, i) => i !== idx));
    const updateHeaderField = (idx, field, value) => {
        const newHeaders = [...headers];
        newHeaders[idx][field] = value;
        setHeaders(newHeaders);
    };

    const sendRequest = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const finalHeaders = {};
            headers.forEach(h => {
                if (h.active && h.key) finalHeaders[h.key] = h.value;
            });

            // Handle Auth
            if (auth.type === 'basic') {
                const credit = btoa(`${auth.username}:${auth.password}`);
                finalHeaders['Authorization'] = `Basic ${credit}`;
            } else if (auth.type === 'bearer') {
                finalHeaders['Authorization'] = `Bearer ${auth.token}`;
            }

            const res = await fetch('/api/tester/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    method,
                    headers: finalHeaders,
                    body: (method !== 'GET' && method !== 'HEAD') ? body : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send request');
            }

            setResponse(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>API Tester</h1>
            </header>

            <div className={styles.requestBar}>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={styles.methodSelect}>
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
                        <option key={m}>{m}</option>
                    ))}
                </select>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => updateUrl(e.target.value)}
                    className={styles.urlInput}
                    placeholder="Enter URL (e.g. https://api.example.com/v1/users)"
                />
                <button onClick={sendRequest} className={styles.sendBtn} disabled={loading}>
                    <Send size={16} /> {loading ? 'Sending...' : 'Send'}
                </button>
            </div>

            <div className={styles.grid}>
                {/* Request Panel */}
                <div className={styles.requestPanel}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'params' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('params')}
                        >
                            Params {params.length > 0 && `(${params.length})`}
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'auth' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('auth')}
                        >
                            Auth {auth.type !== 'none' && '•'}
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'headers' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('headers')}
                        >
                            Headers {headers.length > 0 && `(${headers.length})`}
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'body' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('body')}
                            disabled={['GET', 'HEAD'].includes(method)}
                        >
                            Body
                        </button>
                    </div>

                    <div className={styles.content}>
                        {activeTab === 'params' && (
                            <div className={styles.keyValueGrid}>
                                <div className={styles.sectionHeader}>
                                    Query Parameters
                                    <button onClick={addParam} className={styles.addBtn}><Plus size={14} /></button>
                                </div>
                                {params.map((p, i) => (
                                    <div key={i} className={styles.paramRow}>
                                        <input
                                            placeholder="Key"
                                            value={p.key}
                                            onChange={(e) => updateParamField(i, 'key', e.target.value)}
                                            className={styles.headerInput}
                                        />
                                        <input
                                            placeholder="Value"
                                            value={p.value}
                                            onChange={(e) => updateParamField(i, 'value', e.target.value)}
                                            className={styles.headerInput}
                                        />
                                        <button onClick={() => removeParam(i)} className={styles.removeBtn}><X size={14} /></button>
                                    </div>
                                ))}
                                {params.length === 0 && <div className={styles.placeholder}>No parameters</div>}
                            </div>
                        )}

                        {activeTab === 'auth' && (
                            <div className={styles.authForm}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Authentication Type</label>
                                    <select
                                        value={auth.type}
                                        onChange={(e) => setAuth({ ...auth, type: e.target.value })}
                                        className={styles.select}
                                    >
                                        <option value="none">No Auth</option>
                                        <option value="basic">Basic Auth</option>
                                        <option value="bearer">Bearer Token</option>
                                    </select>
                                </div>

                                {auth.type === 'basic' && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Username</label>
                                            <input
                                                value={auth.username}
                                                onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                                                className={styles.headerInput}
                                                placeholder="Username"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Password</label>
                                            <input
                                                value={auth.password}
                                                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                                                className={styles.headerInput}
                                                type="password"
                                                placeholder="Password"
                                            />
                                        </div>
                                    </>
                                )}

                                {auth.type === 'bearer' && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Token</label>
                                        <input
                                            value={auth.token}
                                            onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                                            className={styles.headerInput}
                                            placeholder="Bearer Token"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'headers' && (
                            <div className={styles.keyValueGrid}>
                                <div className={styles.sectionHeader}>
                                    Headers
                                    <button onClick={addHeader} className={styles.addBtn}><Plus size={14} /></button>
                                </div>
                                {headers.map((h, i) => (
                                    <div key={i} className={styles.paramRow}>
                                        <input
                                            placeholder="Key"
                                            value={h.key}
                                            onChange={(e) => updateHeaderField(i, 'key', e.target.value)}
                                            className={styles.headerInput}
                                        />
                                        <input
                                            placeholder="Value"
                                            value={h.value}
                                            onChange={(e) => updateHeaderField(i, 'value', e.target.value)}
                                            className={styles.headerInput}
                                        />
                                        <button onClick={() => removeHeader(i)} className={styles.removeBtn}><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'body' && (
                            <div className={styles.section}>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className={styles.bodyInput}
                                    placeholder='{"key": "value"}'
                                    style={{ height: '300px' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Response Panel */}
                <div className={styles.responsePanel}>
                    <div className={styles.sectionHeader}>
                        Response
                        {response && (
                            <div className={styles.responseMeta}>
                                <span className={`${styles.metaItem} ${response.status < 400 ? styles.success : styles.fail}`}>
                                    <span className={styles.statusCode}>{response.status}</span> {response.statusText}
                                </span>
                                <span className={styles.metaItem}><Clock size={12} /> {response.time}ms</span>
                            </div>
                        )}
                    </div>

                    {response && (
                        <>
                            <div className={styles.tabs}>
                                <button
                                    className={`${styles.tab} ${responseTab === 'body' ? styles.activeTab : ''}`}
                                    onClick={() => setResponseTab('body')}
                                >
                                    Body
                                </button>
                                <button
                                    className={`${styles.tab} ${responseTab === 'headers' ? styles.activeTab : ''}`}
                                    onClick={() => setResponseTab('headers')}
                                >
                                    Headers ({Object.keys(response.headers).length})
                                </button>
                            </div>

                            <div className={styles.content}>
                                {responseTab === 'body' && (
                                    <pre className={styles.responseBody}>
                                        {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                                    </pre>
                                )}
                                {responseTab === 'headers' && (
                                    <div className={styles.responseHeaders}>
                                        {Object.entries(response.headers).map(([key, value]) => (
                                            <div key={key} className={styles.headerItem}>
                                                <span className={styles.headerKey}>{key}</span>
                                                <span className={styles.headerValue}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {error && <div className={styles.error}>{error}</div>}
                    {!response && !error && (
                        <div className={styles.placeholder}>
                            Send a request to see the response
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
