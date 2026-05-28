'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Scan } from 'lucide-react';
import styles from './page.module.css';

export default function QrTool() {
    const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
    const [text, setText] = useState('https://utilhub.dev');
    const [scanResult, setScanResult] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'scan') {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
            );

            scanner.render(
                (decodedText: string) => {
                    setScanResult(decodedText);
                    scanner.clear();
                },
                (_error: string) => {
                    // handle scan error
                }
            );

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }
    }, [activeTab]);

    return (
        <div className={styles.container}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>QR Code Tool</h1>
            </header>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'generate' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('generate')}
                >
                    <QrCode size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Generate
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'scan' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('scan')}
                >
                    <Scan size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Scan
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'generate' ? (
                    <>
                        <input
                            className={styles.input}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text or URL to generate QR code..."
                        />
                        <div className={styles.qrContainer}>
                            <QRCodeCanvas value={text} size={250} level={"H"} />
                        </div>
                    </>
                ) : (
                    <div style={{ width: '100%', maxWidth: '500px' }}>
                        <div id="reader" className={styles.scanner}></div>
                        {scanResult && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', wordBreak: 'break-all' }}>
                                <strong>Result:</strong> {scanResult}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
