/**
 * API Client collections: versioned localStorage model (folders + saved requests)
 * with migrations from earlier formats.
 */
import {
    type AuthState,
    type KVItem,
    type RequestState,
    migrateRequestState,
    stripFilePayloads,
} from "@/utils/apiClientRequest";

export const COLLECTIONS_SCHEMA_VERSION = 2;

export const COLLECTIONS_KEY = "utilhub_curl_tester_collections";
/** Collections from the retired "API Tester" tool, imported once as folders. */
export const LEGACY_API_TESTER_KEY = "utilhub_api_collections";
const LEGACY_MIGRATED_FLAG = "utilhub_api_collections_migrated";

export interface Folder {
    id: string;
    name: string;
}

export interface SavedRequest {
    id: string;
    name: string;
    folderId: string | null;
    timestamp: number;
    request: RequestState;
}

export interface CollectionsState {
    schemaVersion: number;
    folders: Folder[];
    requests: SavedRequest[];
}

export const EMPTY_COLLECTIONS: CollectionsState = {
    schemaVersion: COLLECTIONS_SCHEMA_VERSION,
    folders: [],
    requests: [],
};

export function newId(): string {
    return crypto.randomUUID();
}

function migrateSaved(raw: Partial<SavedRequest>, folderIds: Set<string>): SavedRequest {
    return {
        id: raw.id || newId(),
        name: raw.name || "Untitled",
        folderId: raw.folderId && folderIds.has(raw.folderId) ? raw.folderId : null,
        timestamp: raw.timestamp || Date.now(),
        request: migrateRequestState(raw.request || {}),
    };
}

/** Accepts any stored shape (v1 flat array, v2 object) and returns current-version state. */
export function migrateCollections(raw: unknown): CollectionsState {
    if (Array.isArray(raw)) {
        // v1: flat SavedRequest[] with no folders
        return {
            schemaVersion: COLLECTIONS_SCHEMA_VERSION,
            folders: [],
            requests: raw.map((r) => migrateSaved(r, new Set())),
        };
    }
    if (raw && typeof raw === "object") {
        const obj = raw as Partial<CollectionsState>;
        const folders = Array.isArray(obj.folders)
            ? obj.folders.filter((f) => f && f.id).map((f) => ({ id: f.id, name: f.name || "Folder" }))
            : [];
        const ids = new Set(folders.map((f) => f.id));
        return {
            schemaVersion: COLLECTIONS_SCHEMA_VERSION,
            folders,
            requests: Array.isArray(obj.requests) ? obj.requests.map((r) => migrateSaved(r, ids)) : [],
        };
    }
    return { ...EMPTY_COLLECTIONS };
}

interface LegacyApiTesterCollection {
    id?: string;
    name?: string;
    requests?: {
        id?: string;
        name?: string;
        method?: string;
        url?: string;
        headers?: KVItem[];
        body?: string;
        auth?: {
            type?: string;
            username?: string;
            password?: string;
            token?: string;
            apiKeyName?: string;
            apiKeyValue?: string;
            apiKeyLocation?: string;
        };
    }[];
}

function legacyAuth(auth: NonNullable<LegacyApiTesterCollection["requests"]>[number]["auth"]): AuthState {
    switch (auth?.type) {
        case "bearer":
            return { type: "bearer", bearerToken: auth.token };
        case "basic":
            return { type: "basic", basicUsername: auth.username, basicPassword: auth.password };
        case "apikey":
            return {
                type: "apikey",
                apiKeyName: auth.apiKeyName,
                apiKeyValue: auth.apiKeyValue,
                apiKeyLocation: auth.apiKeyLocation === "query" ? "query" : "header",
            };
        default:
            return { type: "none" };
    }
}

/** Convert the retired API Tester's collections into folders + requests. */
export function convertLegacyApiTesterCollections(raw: unknown): Pick<CollectionsState, "folders" | "requests"> {
    const folders: Folder[] = [];
    const requests: SavedRequest[] = [];
    if (!Array.isArray(raw)) return { folders, requests };
    (raw as LegacyApiTesterCollection[]).forEach((collection) => {
        const folder: Folder = { id: newId(), name: collection.name || "Imported" };
        folders.push(folder);
        (collection.requests || []).forEach((r) => {
            requests.push({
                id: newId(),
                name: r.name || r.url || "Untitled",
                folderId: folder.id,
                timestamp: Date.now(),
                request: migrateRequestState({
                    method: r.method,
                    url: r.url,
                    headers: Array.isArray(r.headers) ? r.headers : [],
                    body: r.body,
                    auth: legacyAuth(r.auth),
                }),
            });
        });
    });
    return { folders, requests };
}

export function loadCollections(): CollectionsState {
    let state: CollectionsState;
    try {
        const val = localStorage.getItem(COLLECTIONS_KEY);
        state = migrateCollections(val ? JSON.parse(val) : null);
    } catch {
        state = { ...EMPTY_COLLECTIONS };
    }

    // One-time import of the retired API Tester's collections (original key is left untouched)
    try {
        if (!localStorage.getItem(LEGACY_MIGRATED_FLAG)) {
            const legacy = localStorage.getItem(LEGACY_API_TESTER_KEY);
            if (legacy) {
                const converted = convertLegacyApiTesterCollections(JSON.parse(legacy));
                state = {
                    ...state,
                    folders: [...state.folders, ...converted.folders],
                    requests: [...state.requests, ...converted.requests],
                };
                saveCollections(state);
            }
            localStorage.setItem(LEGACY_MIGRATED_FLAG, "1");
        }
    } catch {
        /* ignore malformed legacy data */
    }
    return state;
}

export function saveCollections(state: CollectionsState): boolean {
    try {
        localStorage.setItem(
            COLLECTIONS_KEY,
            JSON.stringify({ ...state, schemaVersion: COLLECTIONS_SCHEMA_VERSION }),
        );
        return true;
    } catch {
        return false;
    }
}

export function makeSavedRequest(name: string, folderId: string | null, request: RequestState): SavedRequest {
    return {
        id: newId(),
        name,
        folderId,
        timestamp: Date.now(),
        request: stripFilePayloads(JSON.parse(JSON.stringify(request))),
    };
}

/** Merge imported folders/requests, giving everything fresh ids so repeat imports never collide. */
export function mergeCollections(
    state: CollectionsState,
    incoming: Pick<CollectionsState, "folders" | "requests">,
): CollectionsState {
    const idMap = new Map<string, string>();
    const folders = incoming.folders.map((f) => {
        const id = newId();
        idMap.set(f.id, id);
        return { id, name: f.name };
    });
    const requests = incoming.requests.map((r) => ({
        ...r,
        id: newId(),
        folderId: r.folderId ? idMap.get(r.folderId) ?? null : null,
    }));
    return {
        schemaVersion: COLLECTIONS_SCHEMA_VERSION,
        folders: [...state.folders, ...folders],
        requests: [...state.requests, ...requests],
    };
}
