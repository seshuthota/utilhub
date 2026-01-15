'use client';

import { useState } from 'react';
import { Plus, X, Trash2, Copy, Check, Edit2 } from 'lucide-react';
import styles from './EnvironmentManager.module.css';

export default function EnvironmentManager({
    isOpen,
    onClose,
    environments,
    activeEnvId,
    setActiveEnvId,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    duplicateEnvironment
}) {
    const [selectedEnvId, setSelectedEnvId] = useState(null);
    const [editingNameId, setEditingNameId] = useState(null);
    const [tempName, setTempName] = useState('');

    if (!isOpen) return null;

    const selectedEnv = environments.find(e => e.id === selectedEnvId) || (environments.length > 0 ? environments[0] : null);

    const handleAddVariable = () => {
        if (!selectedEnv) return;
        const newVars = [...selectedEnv.variables, { key: '', value: '', enabled: true }];
        updateEnvironment(selectedEnv.id, { variables: newVars });
    };

    const updateVariable = (index, field, value) => {
        if (!selectedEnv) return;
        const newVars = [...selectedEnv.variables];
        newVars[index] = { ...newVars[index], [field]: value };
        updateEnvironment(selectedEnv.id, { variables: newVars });
    };

    const deleteVariable = (index) => {
        if (!selectedEnv) return;
        const newVars = selectedEnv.variables.filter((_, i) => i !== index);
        updateEnvironment(selectedEnv.id, { variables: newVars });
    };

    const handleCreateEnv = () => {
        const name = prompt('Environment Name (e.g., Development):');
        if (name) {
            const newEnv = addEnvironment(name);
            setSelectedEnvId(newEnv.id);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Manage Environments</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Sidebar */}
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                            <button className={styles.addEnvBtn} onClick={handleCreateEnv}>
                                <Plus size={16} /> New Env
                            </button>
                        </div>
                        <div className={styles.envList}>
                            {environments.map(env => (
                                <div
                                    key={env.id}
                                    className={`${styles.envItem} ${selectedEnv?.id === env.id ? styles.active : ''}`}
                                    onClick={() => setSelectedEnvId(env.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                        {/* Status Dot */}
                                        <div
                                            style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: activeEnvId === env.id ? '#10b981' : 'var(--border-color)',
                                                cursor: 'pointer'
                                            }}
                                            title={activeEnvId === env.id ? "Active Environment" : "Click to set Active"}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveEnvId(activeEnvId === env.id ? null : env.id);
                                            }}
                                        />

                                        <span>{env.name}</span>
                                    </div>

                                    <div className={styles.envActions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateEnvironment(env.id);
                                            }}
                                            title="Duplicate"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.delete}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete environment?')) deleteEnvironment(env.id);
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className={styles.main}>
                        {selectedEnv ? (
                            <>
                                <div className={styles.variablesHeader}>
                                    <div className={styles.envName}>{selectedEnv.name} Variables</div>
                                    <button className={styles.addEnvBtn} onClick={handleAddVariable}>
                                        <Plus size={16} /> Add Variable
                                    </button>
                                </div>
                                <div className={styles.variablesList}>
                                    {selectedEnv.variables.map((v, i) => (
                                        <div key={i} className={styles.variableRow}>
                                            <input
                                                type="checkbox"
                                                checked={v.enabled}
                                                onChange={(e) => updateVariable(i, 'enabled', e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            <input
                                                className={styles.varInput}
                                                placeholder="Variable"
                                                value={v.key}
                                                onChange={(e) => updateVariable(i, 'key', e.target.value)}
                                            />
                                            <input
                                                className={styles.varInput}
                                                placeholder="Value"
                                                value={v.value}
                                                onChange={(e) => updateVariable(i, 'value', e.target.value)}
                                            />
                                            <button
                                                className={`${styles.actionBtn} ${styles.delete}`}
                                                onClick={() => deleteVariable(i)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedEnv.variables.length === 0 && (
                                        <div className={styles.emptyState}>
                                            <p>No variables defined</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>Select or create an environment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
