import { parseCurl } from "@/utils/curl";

export type BodyMode = "none" | "json" | "raw" | "urlencoded" | "multipart";

export interface KVItem {
    key: string;
    value: string;
    active?: boolean;
}

export interface FormField {
    key: string;
    value: string;
    type: "text" | "file";
    active?: boolean;
    filename?: string;
    contentType?: string;
    contentBase64?: string;
}

export interface AuthState {
    type: "none" | "bearer" | "basic" | "apikey";
    bearerToken?: string;
    basicUsername?: string;
    basicPassword?: string;
    apiKeyName?: string;
    apiKeyValue?: string;
    apiKeyLocation?: "header" | "query";
}

export interface RequestState {
    method: string;
    url: string;
    params: KVItem[];
    headers: KVItem[];
    auth: AuthState;
    bodyMode: BodyMode;
    body: string;
    formFields: FormField[];
}

export interface ProxyFormField {
    key: string;
    value?: string;
    type: "text" | "file";
    filename?: string;
    contentType?: string;
    contentBase64?: string;
}

export interface ProxyPayload {
    url: string;
    method: string;
    headers: Record<string, string>;
    bodyMode?: BodyMode;
    body?: string;
    formFields?: ProxyFormField[];
    timeoutMs?: number;
}

export const DEFAULT_TIMEOUT_MS = 30000;
export const MAX_TIMEOUT_MS = 120000;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function parseParamsFromUrl(url: string): KVItem[] {
    try {
        const qIndex = url.indexOf("?");
        if (qIndex === -1) return [];
        const qs = url.slice(qIndex + 1);
        const params = new URLSearchParams(qs);
        return Array.from(params.entries()).map(([key, value]) => ({ key, value, active: true }));
    } catch {
        return [];
    }
}

export function buildUrl(baseUrl: string, params: KVItem[]): string {
    const qIndex = baseUrl.indexOf("?");
    const base = qIndex === -1 ? baseUrl : baseUrl.slice(0, qIndex);
    const active = params.filter((p) => p.key && p.active !== false);
    if (active.length === 0) return base;
    const qs = active
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join("&");
    return `${base}?${qs}`;
}

export function migrateRequestState(raw: Partial<RequestState> & { body?: string }): RequestState {
    const body = raw.body ?? "";
    const bodyMode: BodyMode =
        raw.bodyMode ??
        (body.trim() ? "json" : "none");

    return {
        method: raw.method || "GET",
        url: raw.url || "",
        params: Array.isArray(raw.params) ? raw.params : parseParamsFromUrl(raw.url || ""),
        headers: Array.isArray(raw.headers) ? raw.headers : [],
        auth: raw.auth
            ? {
                type: raw.auth.type || "none",
                bearerToken: raw.auth.bearerToken,
                basicUsername: raw.auth.basicUsername,
                basicPassword: raw.auth.basicPassword,
                apiKeyName: raw.auth.apiKeyName,
                apiKeyValue: raw.auth.apiKeyValue,
                apiKeyLocation: raw.auth.apiKeyLocation || "header",
            }
            : { type: "none" },
        bodyMode,
        body,
        formFields: Array.isArray(raw.formFields) ? raw.formFields : [],
    };
}

/**
 * Convert a raw cURL string into a RequestState.
 * Uses parseCurl + auth field mapping (bearerToken / basicUsername, etc.).
 */
export function requestStateFromCurl(curlString: string): { request?: RequestState; error?: string } {
    const parsed = parseCurl(curlString) as {
        error?: string;
        method?: string;
        url?: string;
        headers?: { key: string; value: string; active?: boolean }[];
        body?: string;
        bodyMode?: BodyMode;
        formFields?: FormField[];
        params?: KVItem[];
        auth?: {
            type?: string;
            token?: string;
            bearerToken?: string;
            username?: string;
            basicUsername?: string;
            password?: string;
            basicPassword?: string;
            apiKeyName?: string;
            name?: string;
            apiKeyValue?: string;
            value?: string;
            apiKeyLocation?: "header" | "query";
        };
    };

    if (parsed?.error) {
        return { error: parsed.error };
    }
    if (!parsed?.url) {
        return { error: "Could not find URL in cURL command" };
    }

    let auth: AuthState = { type: "none" };
    const pa = parsed.auth || {};
    if (pa.type === "bearer") {
        auth = { type: "bearer", bearerToken: pa.token || pa.bearerToken };
    } else if (pa.type === "basic") {
        auth = {
            type: "basic",
            basicUsername: pa.username || pa.basicUsername,
            basicPassword: pa.password || pa.basicPassword,
        };
    } else if (pa.type === "apikey") {
        auth = {
            type: "apikey",
            apiKeyName: pa.apiKeyName || pa.name,
            apiKeyValue: pa.apiKeyValue || pa.value || pa.token,
            apiKeyLocation: pa.apiKeyLocation || "header",
        };
    }

    const headers = (parsed.headers || []).map((h) => ({
        key: h.key,
        value: h.value,
        active: h.active !== false,
    }));

    const params =
        Array.isArray(parsed.params) && parsed.params.length > 0
            ? parsed.params
            : parseParamsFromUrl(parsed.url || "");

    return {
        request: migrateRequestState({
            method: parsed.method || "GET",
            url: parsed.url || "",
            params,
            headers,
            auth,
            body: parsed.body || "",
            bodyMode: parsed.bodyMode,
            formFields: parsed.formFields || [],
        }),
    };
}

/** Strip file payloads before writing to localStorage. */
export function stripFilePayloads(request: RequestState): RequestState {
    return {
        ...request,
        formFields: request.formFields.map((f) =>
            f.type === "file"
                ? {
                    key: f.key,
                    value: "",
                    type: "file",
                    active: f.active,
                    filename: f.filename,
                    contentType: f.contentType,
                    contentBase64: undefined,
                }
                : f,
        ),
    };
}

/**
 * Adjust headers when body mode changes.
 * Does NOT inject new Content-Type headers — only removes Content-Type for multipart
 * so the proxy can set the correct boundary. Users own all other headers.
 */
export function applyBodyModeContentType(
    headers: KVItem[],
    bodyMode: BodyMode,
): KVItem[] {
    if (bodyMode === "multipart") {
        // Proxy sets multipart Content-Type with boundary; drop any user CT to avoid conflicts
        return headers.filter((h) => h.key.toLowerCase() !== "content-type");
    }
    // Keep headers exactly as the user set them for all other modes
    return headers;
}

type ResolveFn = (text: string) => string;

export function buildRequestHeaders(
    request: RequestState,
    resolve: ResolveFn,
): Record<string, string> {
    const headers: Record<string, string> = {};

    request.headers.forEach((h) => {
        if (h.active === false || !h.key) return;
        // For multipart, never send Content-Type from client (boundary).
        if (request.bodyMode === "multipart" && h.key.toLowerCase() === "content-type") return;
        headers[resolve(h.key)] = resolve(h.value);
    });

    if (request.auth.type === "bearer" && request.auth.bearerToken) {
        headers["Authorization"] = `Bearer ${resolve(request.auth.bearerToken)}`;
    } else if (request.auth.type === "basic" && request.auth.basicUsername) {
        const user = resolve(request.auth.basicUsername);
        const pass = resolve(request.auth.basicPassword || "");
        headers["Authorization"] = `Basic ${btoa(`${user}:${pass}`)}`;
    } else if (
        request.auth.type === "apikey" &&
        request.auth.apiKeyName &&
        request.auth.apiKeyValue &&
        (request.auth.apiKeyLocation || "header") === "header"
    ) {
        headers[resolve(request.auth.apiKeyName)] = resolve(request.auth.apiKeyValue);
    }

    return headers;
}

export function buildFinalUrl(request: RequestState, resolve: ResolveFn): string {
    // URL may already include query params from RequestBuilder sync.
    let url = resolve(request.url.trim());

    if (
        request.auth.type === "apikey" &&
        request.auth.apiKeyName &&
        request.auth.apiKeyValue &&
        request.auth.apiKeyLocation === "query"
    ) {
        const name = resolve(request.auth.apiKeyName);
        const value = resolve(request.auth.apiKeyValue);
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.set(name, value);
            url = urlObj.toString();
        } catch {
            const sep = url.includes("?") ? "&" : "?";
            url = `${url}${sep}${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        }
    }

    return url;
}

export function buildProxyPayload(
    request: RequestState,
    resolve: ResolveFn,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
): ProxyPayload {
    const method = request.method || "GET";
    const url = buildFinalUrl(request, resolve);
    const headers = buildRequestHeaders(request, resolve);
    const bodyMode = request.bodyMode || "none";
    const clampedTimeout = Math.min(
        Math.max(timeoutMs || DEFAULT_TIMEOUT_MS, 1000),
        MAX_TIMEOUT_MS,
    );

    const payload: ProxyPayload = {
        url,
        method,
        headers,
        bodyMode,
        timeoutMs: clampedTimeout,
    };

    if (method === "GET" || method === "HEAD" || bodyMode === "none") {
        return payload;
    }

    if (bodyMode === "json" || bodyMode === "raw") {
        const body = request.body ? resolve(request.body) : "";
        if (body) payload.body = body;
        return payload;
    }

    if (bodyMode === "urlencoded" || bodyMode === "multipart") {
        const fields = (request.formFields || [])
            .filter((f) => f.active !== false && f.key)
            .map((f): ProxyFormField => {
                if (f.type === "file") {
                    return {
                        key: resolve(f.key),
                        type: "file",
                        filename: f.filename,
                        contentType: f.contentType,
                        contentBase64: f.contentBase64,
                        value: f.value,
                    };
                }
                return {
                    key: resolve(f.key),
                    type: "text",
                    value: resolve(f.value || ""),
                };
            });
        payload.formFields = fields;
    }

    return payload;
}

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function looksLikeJson(text: string): boolean {
    const t = text.trim();
    if (!t) return false;
    if (!(t.startsWith("{") || t.startsWith("["))) return false;
    try {
        JSON.parse(t);
        return true;
    } catch {
        return false;
    }
}

export function inferBodyModeFromBody(body: string): BodyMode {
    if (!body?.trim()) return "none";
    return looksLikeJson(body) ? "json" : "raw";
}
