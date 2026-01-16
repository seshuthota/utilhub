'use client';

import { useState, useMemo } from 'react';
import { Key, Copy, Clock, ShieldCheck, ShieldAlert, PenTool, Lock } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from '@/components/Toast';
import { decodeJwt, getExpirationStatus, signJwt } from '@/utils/jwt';
import ShareButton from '@/components/common/ShareButton';
import CodeEditor from '@/components/common/CodeEditor';
import ActionToolbar from '@/components/common/ActionToolbar';
import styles from './page.module.css';

const defaultHeader = {
    "alg": "HS256",
    "typ": "JWT"
};

const defaultPayload = {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
};

export default function JwtTool() {
    const [token, setToken] = useUrlState('token', '');
    const [mode, setMode] = useState<'decode' | 'sign'>('decode');
    const [headerInput, setHeaderInput] = useState(JSON.stringify(defaultHeader, null, 2));
    const [payloadInput, setPayloadInput] = useState(JSON.stringify(defaultPayload, null, 2));
    const [secret, setSecret] = useState('');
    const [signedToken, setSignedToken] = useState('');

    const { showToast } = useToast();

    // Decode logic
    const { header, payload, error } = useMemo(() => decodeJwt(token), [token]);

    // Status logic
    const expiration = useMemo(() => {
        if (!payload || !payload.exp) return null;
        return getExpirationStatus(payload.exp);
    }, [payload]);

    const handleSign = async () => {
        try {
            const h = JSON.parse(headerInput);
            const p = JSON.parse(payloadInput);
            const result = await signJwt(h, p, secret);
            if (result) {
                setSignedToken(result);
            }
        } catch (e) {
            showToast('Invalid JSON in Header or Payload', 'error');
        }
    };

    const copyToClipboard = (text: any, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
        showToast(`${label} copied to clipboard`, 'success');
    };

    // Keyboard Shortcuts
    useHotkeys('c', () => copyToClipboard(payload, 'Payload'), { meta: true, shift: true });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JWT Tool</h1>
                <ShareButton />
            </header>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${mode === 'decode' ? styles.activeTab : ''}`}
                    onClick={() => setMode('decode')}
                >
                    <ShieldCheck size={16} /> Decoder
                </button>
                <button
                    className={`${styles.tab} ${mode === 'sign' ? styles.activeTab : ''}`}
                    onClick={() => setMode('sign')}
                >
                    <PenTool size={16} /> Signer
                </button>
            </div>

            {mode === 'decode' ? (
                <div className={styles.grid}>
                    {/* Input Column */}
                    <div className={styles.column}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}><Key size={16} /> Encoded Token</span>
                                <button
                                    className={styles.copyBtn}
                                    onClick={() => copyToClipboard(token, 'Token')}
                                    title="Copy Token"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            <textarea
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className={styles.inputArea}
                                placeholder="Paste your JWT here (eyJ...)"
                                spellCheck={false}
                            />
                        </div>

                        {/* Status Bar */}
                        {expiration && (
                            <div className={`${styles.statusSection} ${styles[expiration.status]}`}>
                                <div className={styles.statusCard}>
                                    <div className={styles.statusIcon}>
                                        {expiration.isExpired ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                    </div>
                                    <div className={styles.statusInfo}>
                                        <span className={styles.statusLabel}>Status</span>
                                        <span className={styles.statusValue}>
                                            {expiration.isExpired ? 'Expired' : 'Valid Signature Format'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.statusCard}>
                                    <div className={styles.statusIcon}>
                                        <Clock size={18} />
                                    </div>
                                    <div className={styles.statusInfo}>
                                        <span className={styles.statusLabel}>Expiration</span>
                                        <span className={styles.statusValue}>{expiration.text}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Output Column */}
                    <div className={styles.column}>
                        {/* Header */}
                        <div className={styles.card} style={{ flex: 1 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Header</span>
                                <ActionToolbar content={header ? JSON.stringify(header, null, 2) : ''} currentToolId="jwt" />
                            </div>
                            <pre className={styles.jsonContent}>
                                {header ? JSON.stringify(header, null, 2) : <div className={styles.placeholder}>Waiting for token...</div>}
                            </pre>
                        </div>

                        {/* Payload */}
                        <div className={styles.card} style={{ flex: 2 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Payload</span>
                                <ActionToolbar content={payload ? JSON.stringify(payload, null, 2) : ''} currentToolId="jwt" />
                            </div>
                            <pre className={styles.jsonContent}>
                                {payload ? JSON.stringify(payload, null, 2) : <div className={styles.placeholder}>Waiting for token...</div>}
                            </pre>
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                                Error: {error}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className={styles.grid}>
                    <div className={styles.column}>
                        <div className={styles.card} style={{ flex: 1 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Header (JSON)</span>
                            </div>
                            <div className={styles.editorContainer}>
                                <CodeEditor
                                    value={headerInput}
                                    onChange={setHeaderInput}
                                    language="json"
                                />
                            </div>
                        </div>
                        <div className={styles.card} style={{ flex: 2 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Payload (JSON)</span>
                            </div>
                            <div className={styles.editorContainer}>
                                <CodeEditor
                                    value={payloadInput}
                                    onChange={setPayloadInput}
                                    language="json"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}><Lock size={16} /> Secret Key</span>
                            </div>
                            <input
                                type="text"
                                value={secret}
                                onChange={e => setSecret(e.target.value)}
                                className={styles.secretInput}
                                placeholder="Enter secret to sign..."
                            />
                        </div>

                        <button onClick={handleSign} className={styles.signBtn}>
                            <PenTool size={16} /> Sign Token
                        </button>

                        <div className={styles.card} style={{ flex: 1 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Signed Token</span>
                                <button
                                    className={styles.copyBtn}
                                    onClick={() => copyToClipboard(signedToken, 'Token')}
                                    title="Copy Token"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            <textarea
                                value={signedToken}
                                readOnly
                                className={styles.inputArea}
                                placeholder="Generated token will appear here..."
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
