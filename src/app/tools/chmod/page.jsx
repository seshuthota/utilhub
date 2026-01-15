'use client';

import { useState, useEffect } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

export default function ChmodCalculator() {
    // State schema: { owner: {r,w,x}, group: {r,w,x}, public: {r,w,x} }
    const [permissions, setPermissions] = useState({
        owner: { r: true, w: true, x: true }, // 7
        group: { r: true, w: false, x: true }, // 5
        public: { r: true, w: false, x: true }, // 5
    });

    // Derived values state (to allow manual editing)
    const [octal, setOctal] = useState('755');
    const [symbolic, setSymbolic] = useState('-rwxr-xr-x');

    const { showToast } = useToast();

    // Calculate values from permissions object
    const calculateValues = (perms) => {
        let oct = '';
        let sym = '-';

        ['owner', 'group', 'public'].forEach(scope => {
            const p = perms[scope];
            const val = (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);
            oct += val;
            sym += (p.r ? 'r' : '-') + (p.w ? 'w' : '-') + (p.x ? 'x' : '-');
        });

        return { oct, sym };
    };

    // Update state when checkboxes change
    const handleCheckboxChange = (scope, type) => {
        setPermissions(prev => {
            const newPerms = {
                ...prev,
                [scope]: {
                    ...prev[scope],
                    [type]: !prev[scope][type]
                }
            };
            const { oct, sym } = calculateValues(newPerms);
            setOctal(oct);
            setSymbolic(sym);
            return newPerms;
        });
    };

    // Parse Octal Input
    const handleOctalChange = (val) => {
        setOctal(val);

        // Validate and parse only if valid length and chars
        if (/^[0-7]{3}$/.test(val)) {
            const nums = val.split('').map(Number);
            const newPerms = {
                owner: { r: !!(nums[0] & 4), w: !!(nums[0] & 2), x: !!(nums[0] & 1) },
                group: { r: !!(nums[1] & 4), w: !!(nums[1] & 2), x: !!(nums[1] & 1) },
                public: { r: !!(nums[2] & 4), w: !!(nums[2] & 2), x: !!(nums[2] & 1) },
            };
            setPermissions(newPerms);
            const { sym } = calculateValues(newPerms);
            setSymbolic(sym);
        }
    };

    // Parse Symbolic Input (simplified)
    const handleSymbolicChange = (val) => {
        setSymbolic(val);
        // Expect format like -rwxr-xr-x (10 chars)
        if (/^[-d][r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(val)) {
            const chars = val.slice(1); // skip type
            const mapChar = (c) => c !== '-';

            const newPerms = {
                owner: { r: mapChar(chars[0]), w: mapChar(chars[1]), x: mapChar(chars[2]) },
                group: { r: mapChar(chars[3]), w: mapChar(chars[4]), x: mapChar(chars[5]) },
                public: { r: mapChar(chars[6]), w: mapChar(chars[7]), x: mapChar(chars[8]) },
            };

            setPermissions(newPerms);
            const { oct } = calculateValues(newPerms);
            setOctal(oct);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.gridContainer}>
                    <div className={styles.grid}>
                        {/* Header */}
                        <div className={styles.cell}></div>
                        <div className={styles.gridHeader}>Read (4)</div>
                        <div className={styles.gridHeader}>Write (2)</div>
                        <div className={styles.gridHeader}>Exec (1)</div>

                        {/* Owner Row */}
                        <div className={styles.rowLabel}>Owner</div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.owner.r}
                                onChange={() => handleCheckboxChange('owner', 'r')}
                            />
                        </div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.owner.w}
                                onChange={() => handleCheckboxChange('owner', 'w')}
                            />
                        </div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.owner.x}
                                onChange={() => handleCheckboxChange('owner', 'x')}
                            />
                        </div>

                        {/* Group Row */}
                        <div className={styles.rowLabel}>Group</div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.group.r}
                                onChange={() => handleCheckboxChange('group', 'r')}
                            />
                        </div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.group.w}
                                onChange={() => handleCheckboxChange('group', 'w')}
                            />
                        </div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.group.x}
                                onChange={() => handleCheckboxChange('group', 'x')}
                            />
                        </div>

                        {/* Public Row */}
                        <div className={styles.rowLabel}>Public</div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.public.r}
                                onChange={() => handleCheckboxChange('public', 'r')}
                            />
                        </div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.public.w}
                                onChange={() => handleCheckboxChange('public', 'w')}
                            />
                        </div>
                        <div className={styles.cell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={permissions.public.x}
                                onChange={() => handleCheckboxChange('public', 'x')}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.inputs}>
                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.label}>Octal Notation</label>
                            <button
                                onClick={() => copyToClipboard(`chmod ${octal} filename`)}
                                className={styles.actionBtn}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                title="Copy chmod command"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <input
                            className={styles.input}
                            value={octal}
                            onChange={(e) => handleOctalChange(e.target.value)}
                            maxLength={3}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.label}>Symbolic Notation</label>
                            <button
                                onClick={() => copyToClipboard(`chmod ${symbolic} filename`)}
                                className={styles.actionBtn}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                title="Copy chmod command"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <input
                            className={styles.input}
                            value={symbolic}
                            onChange={(e) => handleSymbolicChange(e.target.value)}
                            maxLength={10}
                        />
                    </div>
                </div>

                <div className={styles.explanation}>
                    <strong>Example Command:</strong>
                    <br />
                    <code className={styles.code}>chmod {octal} filename.txt</code>
                    <br />
                    <br />
                    This permission set ({octal}) allows:<br />
                    • Owner to {permissions.owner.r && 'read'}{permissions.owner.r && permissions.owner.w && ', '}{permissions.owner.w && 'write'}{permissions.owner.w && permissions.owner.x && ', '}{permissions.owner.x && 'execute'}<br />
                    • Group to {permissions.group.r ? 'read' : '-'}{permissions.group.w ? ', write' : ''}{permissions.group.x ? ', execute' : ''}<br />
                    • Public to {permissions.public.r ? 'read' : '-'}{permissions.public.w ? ', write' : ''}{permissions.public.x ? ', execute' : ''}
                </div>
            </div>
        </div>
    );
}
