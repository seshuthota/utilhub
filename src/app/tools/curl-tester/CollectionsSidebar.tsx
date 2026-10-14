'use client';

import { useMemo, useState } from "react";
import {
    ChevronDown, ChevronRight, Folder as FolderIcon, FolderPlus, Pencil, Trash2, X, ArrowLeftRight, Check,
} from "lucide-react";
import {
    type CollectionsState,
    type Folder,
    type SavedRequest,
    newId,
} from "@/utils/apiClientStore";
import styles from "./CollectionsSidebar.module.css";

interface CollectionsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    collections: CollectionsState;
    onChange: (next: CollectionsState) => void;
    onLoad: (item: SavedRequest) => void;
    activeRequestId: string | null;
    onImportExport: () => void;
}

const METHOD_COLORS: Record<string, string> = {
    GET: "#22c55e", POST: "#3b82f6", PUT: "#f59e0b",
    PATCH: "#a855f7", DELETE: "#ef4444", HEAD: "#64748b", OPTIONS: "#64748b",
};

type Pending =
    | { kind: "delete-folder"; id: string }
    | { kind: "delete-request"; id: string }
    | null;

export default function CollectionsSidebar({
    isOpen,
    onClose,
    collections,
    onChange,
    onLoad,
    activeRequestId,
    onImportExport,
}: CollectionsSidebarProps) {
    const [query, setQuery] = useState("");
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
    const [moving, setMoving] = useState<string | null>(null);
    const [pending, setPending] = useState<Pending>(null);

    const q = query.trim().toLowerCase();
    const matches = (r: SavedRequest) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.request.url.toLowerCase().includes(q) ||
        r.request.method.toLowerCase() === q;

    const groups = useMemo(() => {
        const byFolder = new Map<string | null, SavedRequest[]>();
        collections.requests.forEach((r) => {
            const list = byFolder.get(r.folderId) || [];
            list.push(r);
            byFolder.set(r.folderId, list);
        });
        return byFolder;
    }, [collections.requests]);

    if (!isOpen) return null;

    const update = (partial: Partial<CollectionsState>) => onChange({ ...collections, ...partial });

    const addFolder = () => {
        const folder: Folder = { id: newId(), name: "New folder" };
        update({ folders: [...collections.folders, folder] });
        setEditing({ id: folder.id, value: folder.name });
    };

    const commitRename = () => {
        if (!editing) return;
        const name = editing.value.trim();
        if (name) {
            if (collections.folders.some((f) => f.id === editing.id)) {
                update({ folders: collections.folders.map((f) => (f.id === editing.id ? { ...f, name } : f)) });
            } else {
                update({ requests: collections.requests.map((r) => (r.id === editing.id ? { ...r, name } : r)) });
            }
        }
        setEditing(null);
    };

    const deleteFolder = (id: string) => {
        update({
            folders: collections.folders.filter((f) => f.id !== id),
            requests: collections.requests.filter((r) => r.folderId !== id),
        });
        setPending(null);
    };

    const deleteRequest = (id: string) => {
        update({ requests: collections.requests.filter((r) => r.id !== id) });
        setPending(null);
    };

    const moveRequest = (id: string, folderId: string | null) => {
        update({ requests: collections.requests.map((r) => (r.id === id ? { ...r, folderId } : r)) });
        setMoving(null);
    };

    const renameInput = (id: string) =>
        editing?.id === id ? (
            <input
                className={styles.renameInput}
                value={editing.value}
                autoFocus
                onChange={(e) => setEditing({ id, value: e.target.value })}
                onBlur={commitRename}
                onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditing(null);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Name"
            />
        ) : null;

    const renderRequest = (r: SavedRequest) => {
        if (pending?.kind === "delete-request" && pending.id === r.id) {
            return (
                <div key={r.id} className={styles.confirmRow}>
                    <span>Delete “{r.name}”?</span>
                    <button className={styles.dangerBtn} onClick={() => deleteRequest(r.id)}>Delete</button>
                    <button className={styles.iconBtn} onClick={() => setPending(null)} aria-label="Cancel delete">
                        <X size={14} />
                    </button>
                </div>
            );
        }
        return (
            <div
                key={r.id}
                className={`${styles.requestRow} ${activeRequestId === r.id ? styles.active : ""}`}
                onClick={() => editing?.id !== r.id && onLoad(r)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && editing?.id !== r.id) onLoad(r);
                }}
            >
                <span className={styles.method} style={{ color: METHOD_COLORS[r.request.method] || "inherit" }}>
                    {r.request.method}
                </span>
                <div className={styles.requestText}>
                    {renameInput(r.id) || <span className={styles.requestName}>{r.name}</span>}
                    <span className={styles.requestUrl}>{r.request.url}</span>
                </div>
                {moving === r.id ? (
                    <select
                        className={styles.moveSelect}
                        autoFocus
                        value={r.folderId || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => moveRequest(r.id, e.target.value || null)}
                        onBlur={() => setMoving(null)}
                        aria-label="Move to folder"
                    >
                        <option value="">(No folder)</option>
                        {collections.folders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.iconBtn} title="Rename" aria-label={`Rename ${r.name}`}
                            onClick={() => setEditing({ id: r.id, value: r.name })}>
                            <Pencil size={13} />
                        </button>
                        <button className={styles.iconBtn} title="Move to folder" aria-label={`Move ${r.name}`}
                            onClick={() => setMoving(r.id)}>
                            <ArrowLeftRight size={13} />
                        </button>
                        <button className={styles.iconBtn} title="Delete" aria-label={`Delete ${r.name}`}
                            onClick={() => setPending({ kind: "delete-request", id: r.id })}>
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const unfiled = (groups.get(null) || []).filter(matches);
    const isEmpty = collections.requests.length === 0 && collections.folders.length === 0;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <aside className={styles.sidebar} aria-label="Collections">
                <div className={styles.header}>
                    <span className={styles.title}>Collections</span>
                    <div className={styles.headerActions}>
                        <button className={styles.textBtn} onClick={onImportExport} title="Import or export collections">
                            <ArrowLeftRight size={14} /> Import / Export
                        </button>
                        <button className={styles.iconBtn} onClick={addFolder} title="New folder" aria-label="New folder">
                            <FolderPlus size={16} />
                        </button>
                        <button className={styles.iconBtn} onClick={onClose} title="Close" aria-label="Close collections">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className={styles.searchRow}>
                    <input
                        className={styles.search}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filter by name, URL or method"
                        aria-label="Filter saved requests"
                    />
                </div>

                <div className={styles.list}>
                    {isEmpty && (
                        <div className={styles.empty}>
                            No saved requests yet. Use <strong>Save</strong> on a request, or import a Postman collection.
                        </div>
                    )}

                    {collections.folders.map((folder) => {
                        const items = (groups.get(folder.id) || []).filter(matches);
                        if (q && items.length === 0) return null;
                        const isCollapsed = collapsed[folder.id] && !q;
                        const total = groups.get(folder.id)?.length || 0;

                        if (pending?.kind === "delete-folder" && pending.id === folder.id) {
                            return (
                                <div key={folder.id} className={styles.confirmRow}>
                                    <span>
                                        Delete “{folder.name}”{total > 0 ? ` and its ${total} request${total === 1 ? "" : "s"}` : ""}?
                                    </span>
                                    <button className={styles.dangerBtn} onClick={() => deleteFolder(folder.id)}>Delete</button>
                                    <button className={styles.iconBtn} onClick={() => setPending(null)} aria-label="Cancel delete">
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={folder.id} className={styles.folder}>
                                <div
                                    className={styles.folderRow}
                                    onClick={() => editing?.id !== folder.id && setCollapsed((c) => ({ ...c, [folder.id]: !c[folder.id] }))}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={!isCollapsed}
                                >
                                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                    <FolderIcon size={14} />
                                    {renameInput(folder.id) || <span className={styles.folderName}>{folder.name}</span>}
                                    <span className={styles.count}>{total}</span>
                                    <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                                        {editing?.id === folder.id ? (
                                            <button className={styles.iconBtn} onMouseDown={commitRename} aria-label="Save name">
                                                <Check size={13} />
                                            </button>
                                        ) : (
                                            <button className={styles.iconBtn} title="Rename folder" aria-label={`Rename folder ${folder.name}`}
                                                onClick={() => setEditing({ id: folder.id, value: folder.name })}>
                                                <Pencil size={13} />
                                            </button>
                                        )}
                                        <button className={styles.iconBtn} title="Delete folder" aria-label={`Delete folder ${folder.name}`}
                                            onClick={() => setPending({ kind: "delete-folder", id: folder.id })}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                {!isCollapsed && (
                                    <div className={styles.folderItems}>
                                        {items.length === 0 ? (
                                            <div className={styles.folderEmpty}>Empty folder</div>
                                        ) : (
                                            items.map(renderRequest)
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {unfiled.length > 0 && (
                        <div className={styles.folder}>
                            {collections.folders.length > 0 && <div className={styles.sectionLabel}>No folder</div>}
                            {unfiled.map(renderRequest)}
                        </div>
                    )}

                    {q && !isEmpty && collections.requests.filter(matches).length === 0 && (
                        <div className={styles.empty}>No requests match “{query}”.</div>
                    )}
                </div>
            </aside>
        </>
    );
}
