'use client';

import { useState } from 'react';
import { Send, Copy, Trash2, Plus, X } from 'lucide-react';
import styles from './page.module.css';

export default function ApiTesterTool() {
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
    const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
    const [body, setBody] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '' }]);
    };

    const removeHeader = (index) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index, field, value) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = value;
        setHeaders(newHeaders);
    };

    const sendRequest = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const headerObj = {};
            headers.forEach(h => {
                if (h.key) headerObj[h.key] = h.value;
            });

            const options = {
                method,
                headers: headerObj,
            };

            if (method !== 'GET' && method !== 'HEAD' && body) {
                options.body = body;
            }

            const startTime = performance.now();
            const res = await fetch(url, options);
            const endTime = performance.now();

            const contentType = res.headers.get('content-type');
            let data;
            if (contentType?.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }

            setResponse({
                status: res.status,
                statusText: res.statusText,
                time: Math.round(endTime - startTime),
                headers: Object.fromEntries(res.headers.entries()),
                data,
            });
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
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                </select>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={styles.urlInput}
                    placeholder="Enter URL..."
                />
                <button onClick={sendRequest} className={styles.sendBtn} disabled={loading}>
                    <Send size={16} /> {loading ? 'Sending...' : 'Send'}
                </button>
            </div>

            <div className={styles.grid}>
                <div className={styles.requestPanel}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            Headers
                            <button onClick={addHeader} className={styles.addBtn}><Plus size={14} /></button>
                        </div>
                        {headers.map((h, i) => (
                            <div key={i} className={styles.headerRow}>
                                <input
                                    placeholder="Key"
                                    value={h.key}
                                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                                    className={styles.headerInput}
                                />
                                <input
                                    placeholder="Value"
                                    value={h.value}
                                    onChange={(e) => updateHeader(i, 'value', e.target.value)}
                                    className={styles.headerInput}
                                />
                                <button onClick={() => removeHeader(i)} className={styles.removeBtn}><X size={14} /></button>
                            </div>
                        ))}
                    </div>

                    {method !== 'GET' && method !== 'HEAD' && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>Body</div>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className={styles.bodyInput}
                                placeholder='{"key": "value"}'
                            />
                        </div>
                    )}
                </div>

                <div className={styles.responsePanel}>
                    <div className={styles.sectionHeader}>Response</div>
                    {error && <div className={styles.error}>{error}</div>}
                    {response && (
                        <>
                            <div className={styles.statusBar}>
                                <span className={`${styles.statusCode} ${response.status < 400 ? styles.success : styles.fail}`}>
                                    {response.status} {response.statusText}
                                </span>
                                <span className={styles.time}>{response.time}ms</span>
                            </div>
                            <pre className={styles.responseBody}>
                                {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                            </pre>
                        </>
                    )}
                    {!response && !error && <div className={styles.placeholder}>Response will appear here</div>}
                </div>
            </div>
        </div>
    );
}
