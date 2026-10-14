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

export interface ResponseData {
    status: number;
    statusText: string;
    time: number;
    headers: Record<string, string>;
    data: unknown;
    size?: number;
    contentType?: string;
    encoding?: "text" | "base64";
    /** Headers this client/proxy intentionally set on the upstream request */
    requestHeadersSent?: Record<string, string>;
    transport?: "proxy" | "browser" | "local-proxy";
    /** Set when the stored copy (history) dropped or shortened the body */
    truncated?: boolean;
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

const TEMPLATE_RE = /\{\{[^{}]+\}\}/g;
const ENCODED_TEMPLATE_RE = /%7B%7B(.+?)%7D%7D/gi;

/** encodeURIComponent that leaves `{{var}}` placeholders intact for send-time resolution. */
export function encodeQueryPart(text: string): string {
    let out = "";
    let last = 0;
    for (const m of text.matchAll(TEMPLATE_RE)) {
        out += encodeURIComponent(text.slice(last, m.index)) + m[0];
        last = (m.index ?? 0) + m[0].length;
    }
    return out + encodeURIComponent(text.slice(last));
}

export function buildUrl(baseUrl: string, params: KVItem[]): string {
    const qIndex = baseUrl.indexOf("?");
    const base = qIndex === -1 ? baseUrl : baseUrl.slice(0, qIndex);
    const active = params.filter((p) => p.key && p.active !== false);
    if (active.length === 0) return base;
    const qs = active
        .map((p) => `${encodeQueryPart(p.key)}=${encodeQueryPart(p.value)}`)
        .join("&");
    return `${base}?${qs}`;
}

/** Variable names referenced as `{{name}}` that `resolve` leaves untouched. */
export function findUnresolvedVariables(request: RequestState, resolve: ResolveFn): string[] {
    const texts = [
        request.url.replace(ENCODED_TEMPLATE_RE, "{{$1}}"),
        ...request.headers.filter((h) => h.active !== false).flatMap((h) => [h.key, h.value]),
        request.auth.bearerToken, request.auth.basicUsername, request.auth.basicPassword,
        request.auth.apiKeyName, request.auth.apiKeyValue,
    ];
    if (request.bodyMode === "json" || request.bodyMode === "raw") texts.push(request.body);
    if (request.bodyMode === "urlencoded" || request.bodyMode === "multipart") {
        request.formFields
            .filter((f) => f.active !== false)
            .forEach((f) => texts.push(f.key, f.type === "file" ? "" : f.value));
    }
    const missing = new Set<string>();
    texts.forEach((t) => {
        if (!t) return;
        for (const m of t.matchAll(TEMPLATE_RE)) {
            if (resolve(m[0]) === m[0]) missing.add(m[0].slice(2, -2).trim());
        }
    });
    return [...missing];
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

/**
 * Resolve `{{var}}` in a URL. Path/host get the raw value (so a variable can hold a
 * whole base URL); query-string placeholders get the value URL-encoded.
 */
export function resolveUrl(rawUrl: string, resolve: ResolveFn): string {
    const url = rawUrl.trim().replace(ENCODED_TEMPLATE_RE, "{{$1}}");
    const qIndex = url.indexOf("?");
    if (qIndex === -1) return resolve(url);
    const query = url.slice(qIndex + 1).replace(TEMPLATE_RE, (tok) => {
        const value = resolve(tok);
        return value === tok ? tok : encodeURIComponent(value);
    });
    return `${resolve(url.slice(0, qIndex))}?${query}`;
}

export function buildFinalUrl(request: RequestState, resolve: ResolveFn): string {
    // URL may already include query params from RequestBuilder sync.
    let url = resolveUrl(request.url, resolve);

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

/**
 * Build browser-native fetch init for "direct" (no proxy) sends.
 * Only user/auth headers are set. Browsers may still add a few restricted
 * headers (Accept, etc.) that pages cannot suppress.
 */
export function buildBrowserFetchInit(
    request: RequestState,
    resolve: ResolveFn,
): { url: string; init: RequestInit; headersSent: Record<string, string> } {
    const method = (request.method || "GET").toUpperCase();
    const url = buildFinalUrl(request, resolve);
    const headers = buildRequestHeaders(request, resolve);
    const bodyMode = request.bodyMode || "none";

    const init: RequestInit = { method };
    let body: BodyInit | undefined;
    const headersSent: Record<string, string> = { ...headers };

    if (method !== "GET" && method !== "HEAD" && bodyMode !== "none") {
        if (bodyMode === "json" || bodyMode === "raw") {
            body = request.body ? resolve(request.body) : undefined;
        } else if (bodyMode === "urlencoded") {
            const params = new URLSearchParams();
            (request.formFields || [])
                .filter((f) => f.active !== false && f.key)
                .forEach((f) => {
                    params.append(resolve(f.key), resolve(f.value || ""));
                });
            body = params.toString();
        } else if (bodyMode === "multipart") {
            const form = new FormData();
            (request.formFields || [])
                .filter((f) => f.active !== false && f.key)
                .forEach((f) => {
                    const key = resolve(f.key);
                    if (f.type === "file" && f.contentBase64) {
                        const binary = atob(f.contentBase64);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                        const blob = new Blob([bytes], {
                            type: f.contentType || "application/octet-stream",
                        });
                        form.append(key, blob, f.filename || "file");
                    } else if (f.type !== "file") {
                        form.append(key, resolve(f.value || ""));
                    }
                });
            body = form;
            // Browser sets multipart Content-Type + boundary — remove user CT
            delete headers["Content-Type"];
            delete headers["content-type"];
            delete headersSent["Content-Type"];
            delete headersSent["content-type"];
            headersSent["Content-Type"] = "multipart/form-data; boundary=<set by browser>";
        }
    }

    if (Object.keys(headers).length > 0) {
        init.headers = headers;
    }
    if (body !== undefined) {
        init.body = body;
    }

    return { url, init, headersSent };
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

const SENSITIVE_HEADER_RE = /^(authorization|proxy-authorization|cookie|set-cookie)$|token|secret|api[-_]?key|password|session/i;

export function isSensitiveHeader(name: string): boolean {
    return SENSITIVE_HEADER_RE.test(name.trim());
}

/** True when the value is nothing but `{{var}}` placeholders (safe to share — no literal secret). */
export function isTemplateOnly(value: string | undefined): boolean {
    if (!value) return true;
    return value.replace(TEMPLATE_RE, "").trim() === "";
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
