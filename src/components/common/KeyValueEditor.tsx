'use client';

import { Plus, X } from "lucide-react";
import styles from "./KeyValueEditor.module.css";

export interface KVItem {
    key: string;
    value: string;
    active?: boolean;
}

interface KeyValueEditorProps {
    items: KVItem[];
    onChange: (items: KVItem[]) => void;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    showEnable?: boolean;
    addLabel?: string;
}

export default function KeyValueEditor({
    items,
    onChange,
    keyPlaceholder = "Key",
    valuePlaceholder = "Value",
    showEnable = false,
    addLabel = "Add",
}: KeyValueEditorProps) {
    const addItem = () => {
        onChange([...items, { key: "", value: "", active: true }]);
    };

    const updateItem = (index: number, field: keyof KVItem, val: any) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: val };
        onChange(next);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.container}>
            {items.map((item, i) => (
                <div key={i} className={styles.row}>
                    {showEnable && (
                        <input
                            type="checkbox"
                            checked={item.active ?? true}
                            onChange={(e) => updateItem(i, "active", e.target.checked)}
                            className={styles.checkbox}
                        />
                    )}
                    <input
                        className={styles.input}
                        value={item.key}
                        onChange={(e) => updateItem(i, "key", e.target.value)}
                        placeholder={keyPlaceholder}
                        spellCheck={false}
                    />
                    <input
                        className={styles.input}
                        value={item.value}
                        onChange={(e) => updateItem(i, "value", e.target.value)}
                        placeholder={valuePlaceholder}
                        spellCheck={false}
                    />
                    <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(i)}
                        title="Remove"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
            <button className={styles.addBtn} onClick={addItem}>
                <Plus size={14} /> {addLabel}
            </button>
        </div>
    );
}
