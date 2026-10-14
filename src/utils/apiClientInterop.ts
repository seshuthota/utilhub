/**
 * API Client import/export: UtilHub JSON, Postman Collection v2.x / environments,
 * `.http` files (VS Code REST Client / JetBrains), and template-only share links.
 * All formats keep `{{var}}` placeholders unresolved.
 */
import type { Environment, EnvVariable } from "@/hooks/useEnvironments";
import {
    type AuthState,
    type BodyMode,
    type FormField,
    type KVItem,
    type RequestState,
    buildUrl,
    isSensitiveHeader,
    isTemplateOnly,
    migrateRequestState,
    parseParamsFromUrl,
    stripFilePayloads,
} from "@/utils/apiClientRequest";
import {
    type CollectionsState,
    type Folder,
    type SavedRequest,
    newId,
} from "@/utils/apiClientStore";

export const UTILHUB_EXPORT_FORMAT = "utilhub-api-client";
export const UTILHUB_EXPORT_VERSION = 1;

export interface ImportResult {
    folders: Folder[];
    requests: SavedRequest[];
    environments: Environment[];
    /** Human-readable notes about things that could not be carried over. */
    warnings: string[];
    source: "utilhub" | "postman-collection" | "postman-environment";
}

// ---------------------------------------------------------------------------
// UtilHub JSON
// ---------------------------------------------------------------------------

export function exportUtilHub(
    collections: CollectionsState,
    environments: Environment[] | null,
): string {
    return JSON.stringify(
        {
            format: UTILHUB_EXPORT_FORMAT,
            schemaVersion: UTILHUB_EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            folders: collections.folders,
            requests: collections.requests.map((r) => ({ ...r, request: stripFilePayloads(r.request) })),
            ...(environments ? { environments } : {}),
        },
        null,
        2,
    );
}

function importUtilHub(data: Record<string, unknown>): ImportResult {
    const folders = Array.isArray(data.folders)
        ? (data.folders as Folder[]).filter((f) => f?.id).map((f) => ({ id: f.id, name: f.name || "Folder" }))
        : [];
    const ids = new Set(folders.map((f) => f.id));
    const requests = Array.isArray(data.requests)
        ? (data.requests as Partial<SavedRequest>[]).map((r) => ({
              id: r.id || newId(),
              name: r.name || "Untitled",
              folderId: r.folderId && ids.has(r.folderId) ? r.folderId : null,
              timestamp: r.timestamp || Date.now(),
              request: migrateRequestState(r.request || {}),
          }))
        : [];
    const environments = Array.isArray(data.environments)
        ? (data.environments as Environment[]).map((e) => ({
              id: newId(),
              name: e.name || "Imported",
              variables: Array.isArray(e.variables) ? e.variables : [],
          }))
        : [];
    return { folders, requests, environments, warnings: [], source: "utilhub" };
}

// ---------------------------------------------------------------------------
// Postman
// ---------------------------------------------------------------------------

interface PmKV {
    key?: string;
    value?: unknown;
    disabled?: boolean;
    type?: string;
    src?: string | string[];
    enabled?: boolean;
}

interface PmAuth {
    type?: string;
    [scheme: string]: unknown;
}

interface PmUrl {
    raw?: string;
    protocol?: string;
    host?: string | string[];
    port?: string;
    path?: string | string[];
    query?: PmKV[];
}

interface PmRequest {
    method?: string;
    url?: string | PmUrl;
    header?: PmKV[] | string;
    body?: {
        mode?: string;
        raw?: string;
        urlencoded?: PmKV[];
        formdata?: PmKV[];
        graphql?: { query?: string; variables?: string | object };
        options?: { raw?: { language?: string } };
        disabled?: boolean;
    };
    auth?: PmAuth;
}

interface PmItem {
    name?: string;
    item?: PmItem[];
    request?: PmRequest | string;
    auth?: PmAuth;
}

/** Postman v2.1 stores auth params as [{key, value}], v2.0 as a plain object. */
function pmAuthParams(auth: PmAuth, scheme: string): Record<string, string> {
    const raw = auth[scheme];
    const out: Record<string, string> = {};
    if (Array.isArray(raw)) {
        (raw as PmKV[]).forEach((p) => {
            if (p.key) out[p.key] = p.value == null ? "" : String(p.value);
        });
    } else if (raw && typeof raw === "object") {
        Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
            out[k] = v == null ? "" : String(v);
        });
    }
    return out;
}

function pmToAuth(auth: PmAuth | undefined, warnings: Set<string>): AuthState {
    if (!auth?.type || auth.type === "noauth") return { type: "none" };
    if (auth.type === "bearer") {
        return { type: "bearer", bearerToken: pmAuthParams(auth, "bearer").token || "" };
    }
    if (auth.type === "basic") {
        const p = pmAuthParams(auth, "basic");
        return { type: "basic", basicUsername: p.username || "", basicPassword: p.password || "" };
    }
    if (auth.type === "apikey") {
        const p = pmAuthParams(auth, "apikey");
        return {
            type: "apikey",
            apiKeyName: p.key || "",
            apiKeyValue: p.value || "",
            apiKeyLocation: p.in === "query" ? "query" : "header",
        };
    }
    warnings.add(`Auth type "${auth.type}" is not supported and was dropped.`);
    return { type: "none" };
}

function pmUrlToString(url: PmRequest["url"]): string {
    if (!url) return "";
    if (typeof url === "string") return url;
    if (url.raw) return url.raw;
    const host = Array.isArray(url.host) ? url.host.join(".") : url.host || "";
    const path = Array.isArray(url.path) ? url.path.join("/") : url.path || "";
    const base = `${url.protocol ? `${url.protocol}://` : ""}${host}${url.port ? `:${url.port}` : ""}${path ? `/${path}` : ""}`;
    const query = (url.query || []).filter((q) => q.key && !q.disabled);
    return buildUrl(base, query.map((q) => ({ key: q.key!, value: String(q.value ?? ""), active: true })));
}

function pmKvList(list: PmKV[] | undefined): KVItem[] {
    return (list || [])
        .filter((h) => h.key)
        .map((h) => ({ key: h.key!, value: h.value == null ? "" : String(h.value), active: !h.disabled }));
}

function pmHeaders(header: PmRequest["header"]): KVItem[] {
    if (typeof header === "string") {
        // v2.0 allows a raw "Key: value\n..." string
        return header
            .split(/\r?\n/)
            .map((line) => line.match(/^\s*([^:]+):\s*(.*)$/))
            .filter((m): m is RegExpMatchArray => Boolean(m))
            .map((m) => ({ key: m[1].trim(), value: m[2], active: true }));
    }
    return pmKvList(header);
}

function pmToRequest(pm: PmRequest | string, inheritedAuth: PmAuth | undefined, warnings: Set<string>): RequestState {
    if (typeof pm === "string") {
        return migrateRequestState({ method: "GET", url: pm });
    }
    const url = pmUrlToString(pm.url);
    let bodyMode: BodyMode = "none";
    let body = "";
    let formFields: FormField[] = [];
    const b = pm.body;
    if (b && !b.disabled) {
        if (b.mode === "raw") {
            body = b.raw || "";
            bodyMode = b.options?.raw?.language === "json" || /^\s*[[{]/.test(body) ? "json" : "raw";
        } else if (b.mode === "urlencoded") {
            bodyMode = "urlencoded";
            formFields = pmKvList(b.urlencoded).map((f) => ({ ...f, type: "text" }));
        } else if (b.mode === "formdata") {
            bodyMode = "multipart";
            formFields = (b.formdata || [])
                .filter((f) => f.key)
                .map((f) => {
                    if (f.type === "file") {
                        warnings.add("File fields were imported without their files — re-attach them before sending.");
                        const src = Array.isArray(f.src) ? f.src[0] : f.src;
                        return { key: f.key!, value: "", type: "file", active: !f.disabled, filename: src?.split(/[\\/]/).pop() };
                    }
                    return { key: f.key!, value: String(f.value ?? ""), type: "text", active: !f.disabled };
                });
        } else if (b.mode === "graphql") {
            bodyMode = "json";
            let variables: unknown = b.graphql?.variables;
            if (typeof variables === "string") {
                try {
                    variables = variables.trim() ? JSON.parse(variables) : undefined;
                } catch {
                    /* keep as string */
                }
            }
            body = JSON.stringify({ query: b.graphql?.query || "", ...(variables ? { variables } : {}) }, null, 2);
        } else if (b.mode === "file") {
            warnings.add("Binary file bodies are not supported and were dropped.");
        }
    }
    return migrateRequestState({
        method: (pm.method || "GET").toUpperCase(),
        url,
        params: parseParamsFromUrl(url),
        headers: pmHeaders(pm.header),
        auth: pmToAuth(pm.auth ?? inheritedAuth, warnings),
        bodyMode,
        body,
        formFields,
    });
}

function importPostmanCollection(data: { info?: { name?: string }; item?: PmItem[]; auth?: PmAuth; variable?: PmKV[] }): ImportResult {
    const warnings = new Set<string>();
    const folders: Folder[] = [];
    const requests: SavedRequest[] = [];

    // UtilHub folders are one level deep: nested Postman folders become "Parent / Child".
    const walk = (items: PmItem[], folderPath: string[], auth: PmAuth | undefined) => {
        let folderId: string | null = null;
        if (folderPath.length > 0 && items.some((i) => i.request)) {
            const folder = { id: newId(), name: folderPath.join(" / ") };
            folders.push(folder);
            folderId = folder.id;
        }
        items.forEach((item) => {
            if (Array.isArray(item.item)) {
                walk(item.item, [...folderPath, item.name || "Folder"], item.auth ?? auth);
            } else if (item.request) {
                requests.push({
                    id: newId(),
                    name: item.name || "Untitled",
                    folderId,
                    timestamp: Date.now(),
                    request: pmToRequest(item.request, auth, warnings),
                });
            }
        });
    };

    const collectionName = data.info?.name || "Postman collection";
    // Top-level requests go into a folder named after the collection so the import stays grouped.
    walk(data.item || [], [collectionName], data.auth);

    const environments: Environment[] = [];
    const vars = pmKvList(data.variable);
    if (vars.length > 0) {
        environments.push({
            id: newId(),
            name: `${collectionName} (collection variables)`,
            variables: vars.map((v) => ({ key: v.key, value: v.value, enabled: v.active !== false })),
        });
    }
    return { folders, requests, environments, warnings: [...warnings], source: "postman-collection" };
}

function importPostmanEnvironment(data: { name?: string; values?: PmKV[] }): ImportResult {
    const variables: EnvVariable[] = (data.values || [])
        .filter((v) => v.key)
        .map((v) => ({ key: v.key!, value: v.value == null ? "" : String(v.value), enabled: v.enabled !== false }));
    return {
        folders: [],
        requests: [],
        environments: [{ id: newId(), name: data.name || "Postman environment", variables }],
        warnings: [],
        source: "postman-environment",
    };
}

function authToPostman(auth: AuthState): PmAuth | undefined {
    const kv = (pairs: Record<string, string | undefined>) =>
        Object.entries(pairs).map(([key, value]) => ({ key, value: value ?? "", type: "string" }));
    switch (auth.type) {
        case "bearer":
            return { type: "bearer", bearer: kv({ token: auth.bearerToken }) };
        case "basic":
            return { type: "basic", basic: kv({ username: auth.basicUsername, password: auth.basicPassword }) };
        case "apikey":
            return {
                type: "apikey",
                apikey: kv({ key: auth.apiKeyName, value: auth.apiKeyValue, in: auth.apiKeyLocation || "header" }),
            };
        default:
            return { type: "noauth" };
    }
}

function requestToPostman(name: string, r: RequestState) {
    const request: Record<string, unknown> = {
        method: r.method,
        header: r.headers.filter((h) => h.key).map((h) => ({ key: h.key, value: h.value, disabled: h.active === false })),
        url: r.url,
        auth: authToPostman(r.auth),
    };
    if (r.bodyMode === "json" || r.bodyMode === "raw") {
        request.body = {
            mode: "raw",
            raw: r.body,
            ...(r.bodyMode === "json" ? { options: { raw: { language: "json" } } } : {}),
        };
    } else if (r.bodyMode === "urlencoded") {
        request.body = {
            mode: "urlencoded",
            urlencoded: r.formFields.map((f) => ({ key: f.key, value: f.value, disabled: f.active === false })),
        };
    } else if (r.bodyMode === "multipart") {
        request.body = {
            mode: "formdata",
            formdata: r.formFields.map((f) =>
                f.type === "file"
                    ? { key: f.key, type: "file", src: f.filename || "", disabled: f.active === false }
                    : { key: f.key, type: "text", value: f.value, disabled: f.active === false },
            ),
        };
    }
    return { name, request };
}

export function exportPostman(collections: CollectionsState, name = "UtilHub API Client"): string {
    const item: unknown[] = collections.requests
        .filter((r) => !r.folderId)
        .map((r) => requestToPostman(r.name, r.request));
    collections.folders.forEach((f) => {
        item.push({
            name: f.name,
            item: collections.requests
                .filter((r) => r.folderId === f.id)
                .map((r) => requestToPostman(r.name, r.request)),
        });
    });
    return JSON.stringify(
        {
            info: {
                name,
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            },
            item,
        },
        null,
        2,
    );
}

// ---------------------------------------------------------------------------
// .http (VS Code REST Client / JetBrains HTTP Client)
// ---------------------------------------------------------------------------

function requestToHttp(name: string, r: RequestState): string {
    const lines = [`### ${name}`, `${r.method} ${r.url}`];
    r.headers
        .filter((h) => h.key && h.active !== false)
        .forEach((h) => lines.push(`${h.key}: ${h.value}`));

    const a = r.auth;
    if (a.type === "bearer" && a.bearerToken) {
        lines.push(`Authorization: Bearer ${a.bearerToken}`);
    } else if (a.type === "basic" && a.basicUsername) {
        // Both REST Client and JetBrains accept "Basic user:pass" and encode it themselves
        lines.push(`Authorization: Basic ${a.basicUsername}:${a.basicPassword || ""}`);
    } else if (a.type === "apikey" && a.apiKeyName && (a.apiKeyLocation || "header") === "header") {
        lines.push(`${a.apiKeyName}: ${a.apiKeyValue || ""}`);
    } else if (a.type === "apikey" && a.apiKeyName && a.apiKeyLocation === "query") {
        lines[1] += `${r.url.includes("?") ? "&" : "?"}${a.apiKeyName}=${a.apiKeyValue || ""}`;
    }

    const active = r.formFields.filter((f) => f.key && f.active !== false);
    if ((r.bodyMode === "json" || r.bodyMode === "raw") && r.body) {
        lines.push("", r.body);
    } else if (r.bodyMode === "urlencoded" && active.length) {
        const hasCt = r.headers.some((h) => h.key.toLowerCase() === "content-type");
        if (!hasCt) lines.push("Content-Type: application/x-www-form-urlencoded");
        lines.push("", active.map((f) => `${f.key}=${f.value}`).join("&"));
    } else if (r.bodyMode === "multipart" && active.length) {
        const boundary = "UtilHubBoundary";
        lines.push(`Content-Type: multipart/form-data; boundary=${boundary}`, "");
        active.forEach((f) => {
            lines.push(`--${boundary}`);
            if (f.type === "file") {
                lines.push(
                    `Content-Disposition: form-data; name="${f.key}"; filename="${f.filename || "file"}"`,
                    "",
                    `< ./${f.filename || "file"}`,
                );
            } else {
                lines.push(`Content-Disposition: form-data; name="${f.key}"`, "", f.value);
            }
        });
        lines.push(`--${boundary}--`);
    }
    return lines.join("\n");
}

export function exportHttpFile(collections: CollectionsState): string {
    const blocks: string[] = [];
    const add = (r: SavedRequest, prefix?: string) =>
        blocks.push(requestToHttp(prefix ? `${prefix} / ${r.name}` : r.name, r.request));
    collections.requests.filter((r) => !r.folderId).forEach((r) => add(r));
    collections.folders.forEach((f) =>
        collections.requests.filter((r) => r.folderId === f.id).forEach((r) => add(r, f.name)),
    );
    return `${blocks.join("\n\n")}\n`;
}

// ---------------------------------------------------------------------------
// Import detection
// ---------------------------------------------------------------------------

/** Parse any supported import file. Throws with a readable message on unknown input. */
export function importAny(text: string): ImportResult {
    let data: Record<string, unknown>;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("File is not valid JSON. Supported: UtilHub export, Postman collection or environment.");
    }
    if (data?.format === UTILHUB_EXPORT_FORMAT) return importUtilHub(data);
    const info = data?.info as { schema?: string } | undefined;
    if (info && Array.isArray(data.item)) {
        if (info.schema && !/collection\/v2/.test(info.schema)) {
            throw new Error("Only Postman Collection v2.0 / v2.1 is supported. Re-export from Postman as v2.1.");
        }
        return importPostmanCollection(data as Parameters<typeof importPostmanCollection>[0]);
    }
    if (Array.isArray(data?.values)) {
        return importPostmanEnvironment(data as Parameters<typeof importPostmanEnvironment>[0]);
    }
    throw new Error("Unrecognized file. Supported: UtilHub export, Postman collection (v2.x) or environment.");
}

// ---------------------------------------------------------------------------
// Share links
// ---------------------------------------------------------------------------

export const SHARE_HASH_KEY = "req";

function toBase64Url(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/**
 * Copy of the request safe to put in a link: file contents dropped, and literal
 * secrets (auth values, sensitive headers) blanked. `{{var}}` references are kept.
 */
export function redactForShare(request: RequestState): { request: RequestState; redacted: number } {
    let redacted = 0;
    const scrub = (value: string | undefined) => {
        if (isTemplateOnly(value)) return value;
        redacted++;
        return "";
    };
    const r = stripFilePayloads(JSON.parse(JSON.stringify(request)) as RequestState);
    r.headers = r.headers.map((h) => (isSensitiveHeader(h.key) ? { ...h, value: scrub(h.value) ?? "" } : h));
    const sensitiveParam = (key: string) => isSensitiveHeader(key) || /^(key|sig|signature|access_token|code)$/i.test(key);
    if (r.params.some((p) => sensitiveParam(p.key) && !isTemplateOnly(p.value))) {
        r.params = r.params.map((p) => (sensitiveParam(p.key) ? { ...p, value: scrub(p.value) ?? "" } : p));
        r.url = buildUrl(r.url, r.params);
    }
    r.auth = {
        ...r.auth,
        bearerToken: scrub(r.auth.bearerToken),
        basicPassword: scrub(r.auth.basicPassword),
        apiKeyValue: scrub(r.auth.apiKeyValue),
    };
    return { request: r, redacted };
}

/** Hash fragment (never sent to a server) encoding a redacted request. */
export function encodeShareHash(request: RequestState): { hash: string; redacted: number } {
    const { request: safe, redacted } = redactForShare(request);
    return { hash: `#${SHARE_HASH_KEY}=${toBase64Url(JSON.stringify(safe))}`, redacted };
}

export function decodeShareHash(hash: string): RequestState | null {
    const match = hash.match(new RegExp(`[#&]${SHARE_HASH_KEY}=([A-Za-z0-9_-]+)`));
    if (!match) return null;
    try {
        return migrateRequestState(JSON.parse(fromBase64Url(match[1])));
    } catch {
        return null;
    }
}
