'use client';

import { useState, useEffect } from 'react';



import { Send, Copy, Trash2, Plus, X, Clock, Database, Globe, History, RotateCcw, Terminal, Upload, Folder, Save, ChevronRight, ChevronDown } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from '@/components/Toast';
import { parseCurl } from '@/utils/curl';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import styles from './page.module.css';
import { useEnvironments, substituteVariables } from '@/hooks/useEnvironments';
import { useHistory } from '@/hooks/useHistory';
import EnvironmentManager from './EnvironmentManager';
import HistorySidebar from '@/components/common/HistorySidebar';

const HISTORY_KEY = 'utilhub_api_history';
const COLLECTIONS_KEY = 'utilhub_api_collections';
const MAX_HISTORY = 20;

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
    const { history, addToHistory, clearHistory } = useHistory(HISTORY_KEY, 20);
    const [showHistory, setShowHistory] = useState(false);
    const [showCurlImport, setShowCurlImport] = useState(false);
    const [curlInput, setCurlInput] = useState('');

    // Collections State
    const [collections, setCollections] = useState([]);
    const [showCollections, setShowCollections] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveRequestName, setSaveRequestName] = useState('');
    const [selectedCollectionId, setSelectedCollectionId] = useState('');
    const [expandedCollections, setExpandedCollections] = useState({});

    // Environments State
    const {
        environments,
        activeEnvId,
        setActiveEnvId,
        addEnvironment,
        updateEnvironment,
        deleteEnvironment,
        duplicateEnvironment,
        getActiveEnvironment
    } = useEnvironments();
    const [showEnvManager, setShowEnvManager] = useState(false);

    const { showToast } = useToast();

    // Load collections from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(COLLECTIONS_KEY);
            if (saved) {
                const loaded = JSON.parse(saved);
                setCollections(loaded);
                // Expand all by default
                const expanded = {};
                loaded.forEach(c => expanded[c.id] = true);
                setExpandedCollections(expanded);
            }
        } catch (e) {
            console.error('Failed to load collections:', e);
        }
    }, []);

    // Save request to history
    // Save request to history
    const handleSaveToHistory = (req) => {
        const entry = {
            id: Date.now(),
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            timestamp: new Date().toISOString()
        };
        addToHistory(entry);
    };

    // Load request from history
    const loadFromHistory = (entry) => {
        setMethod(entry.method);
        setUrl(entry.url);
        setHeaders(Object.entries(entry.headers || {}).map(([key, value]) => ({ key, value, active: true })));
        setBody(entry.body || '');
        setShowHistory(false);
        showToast('Request loaded from history', 'success');
    };




    // Collection Management
    const createCollection = (name) => {
        if (!name.trim()) return;
        const newCollection = {
            id: Date.now().toString(),
            name: name.trim(),
            requests: []
        };
        const newCollections = [...collections, newCollection];
        setCollections(newCollections);
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(newCollections));
        setExpandedCollections(prev => ({ ...prev, [newCollection.id]: true }));
        showToast('Collection created', 'success');
    };

    const deleteCollection = (id) => {
        if (!confirm('Delete this collection and all its requests?')) return;
        const newCollections = collections.filter(c => c.id !== id);
        setCollections(newCollections);
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(newCollections));
        showToast('Collection deleted', 'success');
    };

    const saveRequestToCollection = () => {
        if (!saveRequestName.trim() || !selectedCollectionId) {
            showToast('Please enter a name and select a collection', 'error');
            return;
        }

        const newCollections = collections.map(c => {
            if (c.id === selectedCollectionId) {
                return {
                    ...c,
                    requests: [...c.requests, {
                        id: Date.now().toString(),
                        name: saveRequestName.trim(),
                        method,
                        url,
                        headers,
                        body,
                        auth
                    }]
                };
            }
            return c;
        });

        setCollections(newCollections);
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(newCollections));
        setShowSaveModal(false);
        setSaveRequestName('');
        showToast('Request saved to collection', 'success');
    };

    const deleteRequestFromCollection = (collectionId, requestId) => {
        const newCollections = collections.map(c => {
            if (c.id === collectionId) {
                return {
                    ...c,
                    requests: c.requests.filter(r => r.id !== requestId)
                };
            }
            return c;
        });
        setCollections(newCollections);
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(newCollections));
        showToast('Request deleted', 'success');
    };

    const loadFromCollection = (req) => {
        setMethod(req.method);
        setUrl(req.url);
        setHeaders(req.headers);
        setBody(req.body);
        if (req.auth) setAuth(req.auth);
        showToast(`Loaded "${req.name}"`, 'success');
        setShowCollections(false);
    };

    const toggleCollection = (id) => {
        setExpandedCollections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Generate cURL command
    const generateCurl = () => {
        let curl = `curl -X ${method} '${url}'`;

        // Add headers
        headers.forEach(h => {
            if (h.active && h.key) {
                curl += ` \\\n  -H '${h.key}: ${h.value}'`;
            }
        });

        // Add auth header
        if (auth.type === 'basic') {
            const creds = btoa(`${auth.username}:${auth.password}`);
            curl += ` \\\n  -H 'Authorization: Basic ${creds}'`;
        } else if (auth.type === 'bearer') {
            curl += ` \\\n  -H 'Authorization: Bearer ${auth.token}'`;
        }

        // Add body for non-GET requests
        if (body && !['GET', 'HEAD'].includes(method)) {
            curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
        }

        return curl;
    };

    const copyAsCurl = () => {
        const curlCmd = generateCurl();
        navigator.clipboard.writeText(curlCmd);
        showToast('cURL command copied to clipboard!', 'success');
    };

    const handleImportCurl = () => {
        const result = parseCurl(curlInput);
        if (result.error) {
            showToast(result.error, 'error');
            return;
        }

        setMethod(result.method);
        setUrl(result.url);
        if (result.headers.length > 0) {
            setHeaders(result.headers);
        }
        if (result.body) {
            setBody(result.body);
        }
        if (result.auth && result.auth.type !== 'none') {
            setAuth(result.auth);
        }

        setShowCurlImport(false);
        setCurlInput('');
        setResponse(null);
        setError(null);
        showToast('cURL imported successfully!', 'success');
    };

    // Keyboard Shortcuts
    useHotkeys('Enter', () => sendRequest(), { meta: true });

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
            const activeEnv = getActiveEnvironment();
            const variables = activeEnv ? activeEnv.variables : [];

            // Apply substitutions
            let finalUrl = substituteVariables(url, variables);
            const finalBody = (method !== 'GET' && method !== 'HEAD') ? substituteVariables(body, variables) : undefined;

            const finalHeaders = {};
            headers.forEach(h => {
                if (h.active && h.key) {
                    const key = substituteVariables(h.key, variables);
                    const value = substituteVariables(h.value, variables);
                    finalHeaders[key] = value;
                }
            });

            // Handle Auth
            if (auth.type === 'basic') {
                const credit = btoa(`${substituteVariables(auth.username, variables)}:${substituteVariables(auth.password, variables)}`);
                finalHeaders['Authorization'] = `Basic ${credit}`;
            } else if (auth.type === 'bearer') {
                finalHeaders['Authorization'] = `Bearer ${substituteVariables(auth.token, variables)}`;
            } else if (auth.type === 'apikey' && auth.apiKeyName && auth.apiKeyValue) {
                const name = substituteVariables(auth.apiKeyName, variables);
                const value = substituteVariables(auth.apiKeyValue, variables);

                if (auth.apiKeyLocation === 'header') {
                    finalHeaders[name] = value;
                }
            }

            // Build final URL with API Key if needed
            if (auth.type === 'apikey' && auth.apiKeyLocation === 'query' && auth.apiKeyName && auth.apiKeyValue) {
                const name = substituteVariables(auth.apiKeyName, variables);
                const value = substituteVariables(auth.apiKeyValue, variables);

                try {
                    const urlObj = new URL(finalUrl);
                    urlObj.searchParams.set(name, value);
                    finalUrl = urlObj.toString();
                } catch (e) {
                    // if finalUrl invalid (e.g. contains variable in scheme/host), basic substitution already happened above
                }
            }

            const res = await fetch('/api/tester/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: finalUrl,
                    method,
                    headers: finalHeaders,
                    body: finalBody
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send request');
            }


            setResponse(data);

            // Save to history
            // Save to history
            handleSaveToHistory({ method, url, headers: finalHeaders, body: finalBody });
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
                <div className={styles.actions}>
                    <div className={styles.envSelector}>
                        <select
                            value={activeEnvId || ''}
                            onChange={(e) => setActiveEnvId(e.target.value || null)}
                            className={styles.envSelect}
                        >
                            <option value="">No Environment</option>
                            {environments.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowEnvManager(true)}
                            title="Manage Environments"
                        >
                            <Globe size={16} />
                        </button>
                    </div>

                    <button
                        className={`${styles.actionBtn} ${showHistory ? styles.active : ''}`}
                        onClick={() => { setShowHistory(!showHistory); setShowCollections(false); }}
                    >
                        <History size={16} /> History {history.length > 0 && `(${history.length})`}
                    </button>
                    <button
                        className={`${styles.actionBtn} ${showCollections ? styles.active : ''}`}
                        onClick={() => { setShowCollections(!showCollections); setShowHistory(false); }}
                    >
                        <Folder size={16} /> Collections
                    </button>
                </div>
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
                <button onClick={() => setShowSaveModal(true)} className={styles.saveBtn} title="Save to Collection">
                    <Save size={16} />
                </button>
                <button onClick={copyAsCurl} className={styles.curlBtn} title="Copy as cURL">
                    <Terminal size={16} /> cURL
                </button>
                <button onClick={() => setShowCurlImport(true)} className={styles.importBtn} title="Import cURL">
                    <Upload size={16} /> Import
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
                                        <option value="apikey">API Key</option>
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

                                {auth.type === 'apikey' && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Key Name</label>
                                            <input
                                                value={auth.apiKeyName || ''}
                                                onChange={(e) => setAuth({ ...auth, apiKeyName: e.target.value })}
                                                className={styles.headerInput}
                                                placeholder="e.g., X-API-Key"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Key Value</label>
                                            <input
                                                value={auth.apiKeyValue || ''}
                                                onChange={(e) => setAuth({ ...auth, apiKeyValue: e.target.value })}
                                                className={styles.headerInput}
                                                placeholder="Your API Key"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Add To</label>
                                            <select
                                                value={auth.apiKeyLocation || 'header'}
                                                onChange={(e) => setAuth({ ...auth, apiKeyLocation: e.target.value })}
                                                className={styles.select}
                                            >
                                                <option value="header">Header</option>
                                                <option value="query">Query Param</option>
                                            </select>
                                        </div>
                                    </>
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
                                {response.headers['content-type'] && (
                                    (response.headers['content-type'].includes('text/html') ||
                                        response.headers['content-type'].includes('image/')) && (
                                        <button
                                            className={`${styles.tab} ${responseTab === 'preview' ? styles.activeTab : ''}`}
                                            onClick={() => setResponseTab('preview')}
                                        >
                                            Preview
                                        </button>
                                    )
                                )}
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
                                        <code
                                            dangerouslySetInnerHTML={{
                                                __html: Prism.highlight(
                                                    typeof response.data === 'string'
                                                        ? response.data
                                                        : JSON.stringify(response.data, null, 2),
                                                    Prism.languages.json,
                                                    'json'
                                                )
                                            }}
                                        />
                                    </pre>
                                )}
                                {responseTab === 'preview' && (
                                    <div className={styles.previewContainer}>
                                        {response.headers['content-type'].includes('image/') ? (
                                            <div className={styles.imagePreview}>
                                                <img
                                                    src={response.url}
                                                    alt="Response Preview"
                                                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                                                />
                                            </div>
                                        ) : (
                                            <iframe
                                                title="Response Preview"
                                                srcDoc={response.data}
                                                className={styles.iframePreview}
                                                sandbox="allow-scripts"
                                            />
                                        )}
                                    </div>
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

            {/* History Sidebar */}
            <HistorySidebar
                history={history}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onClear={clearHistory}
                onSelect={loadFromHistory}
                title="Request History"
                renderItem={(entry) => (
                    <div className={styles.historyItemContent}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span className={`${styles.methodBadge} ${styles[entry.method.toLowerCase()]}`}>
                                {entry.method}
                            </span>
                            <span className={styles.historyTime}>
                                {new Date(entry.id).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className={styles.historyUrl} title={entry.url}>
                            {entry.url}
                        </div>
                    </div>
                )}
            />

            {/* Collections Sidebar */}
            {showCollections && (
                <div className={styles.historyPanel}>
                    <div className={styles.historyHeader}>
                        <span>Collections</span>
                        <div className={styles.collectionActions}>
                            <button
                                onClick={() => {
                                    const name = prompt('New Collection Name:');
                                    if (name) createCollection(name);
                                }}
                                className={styles.createBtn}
                            >
                                <Plus size={14} /> New
                            </button>
                            <button onClick={() => setShowCollections(false)} className={styles.iconBtn}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.historyList}>
                        {collections.length === 0 ? (
                            <div className={styles.placeholder}>No collections</div>
                        ) : (
                            collections.map(col => (
                                <div key={col.id} className={styles.collectionItem}>
                                    <div className={styles.collectionHeader} onClick={() => toggleCollection(col.id)}>
                                        <div className={styles.collectionTitle}>
                                            {expandedCollections[col.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            <Folder size={14} className={styles.folderIcon} />
                                            <span>{col.name}</span>
                                            <span className={styles.count}>({col.requests.length})</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}
                                            className={styles.deleteBtn}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    {expandedCollections[col.id] && (
                                        <div className={styles.collectionRequests}>
                                            {col.requests.map(req => (
                                                <div key={req.id} className={styles.savedRequest}>
                                                    <div
                                                        className={styles.savedRequestInfo}
                                                        onClick={() => loadFromCollection(req)}
                                                    >
                                                        <span className={`${styles.methodBadge} ${styles[req.method.toLowerCase()]}`}>
                                                            {req.method}
                                                        </span>
                                                        <span className={styles.savedRequestName}>{req.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteRequestFromCollection(col.id, req.id)}
                                                        className={styles.deleteRequestBtn}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {col.requests.length === 0 && (
                                                <div className={styles.emptyCollection}>Empty</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Environment Manager Modal */}
            <EnvironmentManager
                isOpen={showEnvManager}
                onClose={() => setShowEnvManager(false)}
                environments={environments}
                activeEnvId={activeEnvId}
                setActiveEnvId={setActiveEnvId}
                addEnvironment={addEnvironment}
                updateEnvironment={updateEnvironment}
                deleteEnvironment={deleteEnvironment}
                duplicateEnvironment={duplicateEnvironment}
            />

            {/* Save Request Modal */}
            {showSaveModal && (
                <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Save Request</h3>
                            <button onClick={() => setShowSaveModal(false)} className={styles.closeBtn}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Request Name</label>
                                <input
                                    value={saveRequestName}
                                    onChange={(e) => setSaveRequestName(e.target.value)}
                                    className={styles.headerInput}
                                    placeholder="e.g., Get All Users"
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Collection</label>
                                <select
                                    value={selectedCollectionId}
                                    onChange={(e) => setSelectedCollectionId(e.target.value)}
                                    className={styles.select}
                                >
                                    <option value="">Select a collection...</option>
                                    {collections.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {collections.length === 0 && (
                                <div className={styles.hint}>
                                    No collections created yet. <button onClick={() => {
                                        const name = prompt('New Collection Name:');
                                        if (name) createCollection(name);
                                    }} className={styles.linkBtn}>Create one</button>
                                </div>
                            )}
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowSaveModal(false)} className={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button
                                onClick={saveRequestToCollection}
                                className={styles.importActionBtn}
                                disabled={!saveRequestName.trim() || !selectedCollectionId}
                            >
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* cURL Import Modal */}
            {showCurlImport && (
                <div className={styles.modalOverlay} onClick={() => setShowCurlImport(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Import cURL</h3>
                            <button onClick={() => setShowCurlImport(false)} className={styles.closeBtn}>
                                <X size={18} />
                            </button>
                        </div>
                        <textarea
                            value={curlInput}
                            onChange={(e) => setCurlInput(e.target.value)}
                            className={styles.curlTextarea}
                            placeholder={`Paste your cURL command here...

Example:
curl -X POST 'https://api.example.com/data' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"key": "value"}'`}
                            rows={10}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowCurlImport(false)} className={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={handleImportCurl} className={styles.importActionBtn} disabled={!curlInput.trim()}>
                                <Upload size={16} /> Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
