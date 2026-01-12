'use client';

import { useState, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Key, AlertTriangle, Copy, Clock } from 'lucide-react';
import styles from './page.module.css';

export default function JwtTool() {
    const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

    const decoded = useMemo(() => {
        try {
            if (!token.trim()) return { header: null, payload: null, error: null };

            const parts = token.split('.');
            if (parts.length !== 3) {
                return { header: null, payload: null, error: 'Invalid JWT format (expected 3 parts)' };
            }

            const header = JSON.parse(atob(parts[0]));
            const payload = jwtDecode(token);

            return { header, payload, error: null };
        } catch (e) {
            return { header: null, payload: null, error: e.message };
        }
    }, [token]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JWT Decoder</h1>
            </header>

            <div className={styles.inputSection}>
                <label>Paste JWT Token</label>
                <textarea
                    className={styles.tokenInput}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiI..."
                />
            </div>

            {decoded.error && (
                <div className={styles.error}>
                    <AlertTriangle size={16} /> {decoded.error}
                </div>
            )}

            {decoded.header && decoded.payload && (
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Header</h2>
                        <pre className={styles.json}>{JSON.stringify(decoded.header, null, 2)}</pre>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Payload</h2>
                        <pre className={styles.json}>{JSON.stringify(decoded.payload, null, 2)}</pre>

                        {decoded.payload.exp && (
                            <div className={styles.meta}>
                                <Clock size={14} /> Expires: {formatDate(decoded.payload.exp)}
                            </div>
                        )}
                        {decoded.payload.iat && (
                            <div className={styles.meta}>
                                <Clock size={14} /> Issued: {formatDate(decoded.payload.iat)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
