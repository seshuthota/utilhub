'use client';

import { useState, useEffect, useCallback } from 'react';
import { optimize } from 'svgo/browser';
import { Upload, Download, Copy, RefreshCw, Zap, Maximize, Settings } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import { useToast } from '@/components/Toast';
import CodeEditor from '@/components/common/CodeEditor';
import ActionToolbar from '@/components/common/ActionToolbar';
import styles from './page.module.css';

const DEFAULT_SVG = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>`;

export default function SvgOptimizer() {
    const [input, setInput] = useUrlState('code', DEFAULT_SVG);
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ original: 0, optimized: 0, saved: 0 });
    const { showToast } = useToast();

    // Config options
    const [config, setConfig] = useState({
        multipass: true,
        plugins: {
            removeDimensions: true,
            removeViewBox: false,
            removeXMLNS: false,
            cleanupIds: true,
        }
    });

    // Optimize function
    const runOptimization = useCallback(() => {
        if (!input.trim()) return;

        try {
            const plugins = [
                'preset-default',
            ];

            if (config.plugins.removeDimensions) plugins.push('removeDimensions');
            if (config.plugins.removeViewBox) plugins.push('removeViewBox');
            if (config.plugins.removeXMLNS) plugins.push('removeXMLNS');
            if (config.plugins.cleanupIds) plugins.push('cleanupIds');

            const result = optimize(input, {
                multipass: config.multipass,
                plugins: plugins
            });

            if (result.error) throw new Error(result.error);

            setOutput(result.data);

            // Calc stats
            const originalSize = new Blob([input]).size;
            const optimizedSize = new Blob([result.data]).size;
            const saved = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

            setStats({
                original: originalSize,
                optimized: optimizedSize,
                saved: saved > 0 ? saved : 0
            });
            setError(null);
        } catch (e) {
            console.error(e);
            setError(e.message || "Optimization failed");
        }
    }, [input, config]);

    // Auto-run on change
    useEffect(() => {
        runOptimization();
    }, [runOptimization]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setInput(e.target.result);
            reader.readAsText(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.includes('svg')) {
            const reader = new FileReader();
            reader.onload = (e) => setInput(e.target.result);
            reader.readAsText(file);
        }
    };

    const downloadSvg = () => {
        const blob = new Blob([output], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized.svg';
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        return (bytes / 1024).toFixed(2) + ' KB';
    };

    const togglePlugin = (key) => {
        setConfig(prev => ({
            ...prev,
            plugins: { ...prev.plugins, [key]: !prev.plugins[key] }
        }));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>SVG Optimizer</h1>
                <div className={styles.actions}>
                    <label className={styles.button}>
                        <Upload size={16} /> Upload
                        <input type="file" accept=".svg" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                    <button className={styles.primaryBtn} onClick={downloadSvg} disabled={!output}>
                        <Download size={16} /> Download
                    </button>
                </div>
            </header>

            <div className={styles.main}>
                {/* Sidebar Config */}
                <div className={styles.sidebar}>
                    <div className={styles.configSection}>
                        <div className={styles.sectionTitle}>
                            <Settings size={14} /> Optimization Settings
                        </div>

                        <div className={styles.optionRow}>
                            <label>Multipass</label>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={config.multipass}
                                onChange={(e) => setConfig({ ...config, multipass: e.target.checked })}
                            />
                        </div>

                        <div className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>Plugins</div>

                        <div className={styles.optionRow}>
                            <label title="Remove width/height attributes">Remove Dimensions</label>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={config.plugins.removeDimensions}
                                onChange={() => togglePlugin('removeDimensions')}
                            />
                        </div>
                        <div className={styles.optionRow}>
                            <label title="Remove viewBox attribute (not recommended)">Remove ViewBox</label>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={config.plugins.removeViewBox}
                                onChange={() => togglePlugin('removeViewBox')}
                            />
                        </div>
                        <div className={styles.optionRow}>
                            <label title="Remove xmlns attribute">Remove XMLNS</label>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={config.plugins.removeXMLNS}
                                onChange={() => togglePlugin('removeXMLNS')}
                            />
                        </div>
                        <div className={styles.optionRow}>
                            <label title="Remove unused IDs">Cleanup IDs</label>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={config.plugins.cleanupIds}
                                onChange={() => togglePlugin('cleanupIds')}
                            />
                        </div>
                    </div>

                    <div className={styles.configSection}>
                        <div className={styles.sectionTitle}>Statistics</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Original:</span>
                                <span>{formatSize(stats.original)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                <span>Optimized:</span>
                                <span>{formatSize(stats.optimized)}</span>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <span className={styles.statBadge}>
                                    Saved {stats.saved}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={styles.splitView} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                    {/* Input Pane */}
                    <div className={styles.pane}>
                        <div className={styles.paneHeader}>
                            <span>Original SVG</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className={styles.button} onClick={() => setInput(DEFAULT_SVG)} title="Reset">
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>
                        <div className={styles.editorArea}>
                            <CodeEditor
                                value={input}
                                onChange={setInput}
                                language="xml"
                                placeholder="Paste SVG code here..."
                            />
                        </div>
                    </div>

                    {/* Output Pane */}
                    <div className={styles.pane}>
                        <div className={styles.paneHeader}>
                            <span>Optimized SVG</span>
                            <ActionToolbar content={output} currentToolId="svg-optimizer" />
                        </div>
                        <div className={styles.previewContainer}>
                            {error ? (
                                <div style={{ color: 'var(--error-color)', textAlign: 'center' }}>
                                    <p>Error optimizing SVG</p>
                                    <small>{error}</small>
                                </div>
                            ) : (
                                <div
                                    className={styles.svgWrapper}
                                    dangerouslySetInnerHTML={{ __html: output }}
                                />
                            )}
                        </div>
                        <div className={styles.editorArea} style={{ flex: '0 0 30%', borderTop: '1px solid var(--border-color)' }}>
                            <div className={styles.paneHeader} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Code Preview</div>
                            <CodeEditor
                                value={output}
                                readOnly={true}
                                language="xml"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
