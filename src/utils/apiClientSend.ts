/**
 * API Client send engine: turns a RequestState into a normalized ResponseData,
 * independent of React so it can be tested (and reused) without the page.
 */
import {
    type RequestState,
    type ResponseData,
    DEFAULT_TIMEOUT_MS,
    buildBrowserFetchInit,
    buildProxyPayload,
} from "@/utils/apiClientRequest";

export type SendMode = "proxy" | "browser" | "local";

export const HOSTED_PROXY_URL = "/api/tester/proxy";
export const LOCAL_PROXY_URL = "http://127.0.0.1:3927/proxy";

export interface SendResult {
    response?: ResponseData;
    /** Fatal error (no response) or, alongside a response, a guidance hint. */
    error?: string;
    /** Raw error text, before guidance is added (for toasts). */
    rawError?: string;
}

type ResolveFn = (text: string) => string;

export function isTextContentType(contentType: string): boolean {
    const ct = contentType.toLowerCase();
    if (!ct) return true;
    return (
        ct.startsWith("text/") ||
        /json|xml|javascript|svg|yaml|csv|html|css|urlencoded/.test(ct)
    );
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

export function explainTransportError(sendMode: SendMode, message: string, responseText?: string): string {
    const combined = `${message} ${responseText || ""}`.toLowerCase();
    if (sendMode === "browser" && /failed to fetch|networkerror|cors/i.test(message)) {
        return (
            "The request was blocked — usually CORS (the API doesn't allow calls from this page) or the host is unreachable. " +
            "To keep requests on your own network: run `npm run proxy:local`, then Send via → Local proxy. " +
            "Or enable CORS on your API for this origin."
        );
    }
    if (/x-vercel-id|vercel-id|header.*(not allowed|forbidden|restricted|not permitted)/i.test(combined)) {
        return (
            "Your API rejected a restricted header (often x-vercel-id). " +
            "The hosted Proxy runs on Vercel, which can surface platform headers on Vercel-hosted APIs. " +
            "Fix: run `npm run proxy:local` and choose Send via → Local proxy " +
            "(requests leave from your machine, not Vercel). " +
            "Or allowlist x-vercel-id on the API if it is deployed on Vercel " +
            "(Vercel injects that header on all inbound traffic to Vercel apps)."
        );
    }
    return message;
}

async function sendDirect(request: RequestState, resolve: ResolveFn, signal?: AbortSignal): Promise<SendResult> {
    const { url, init, headersSent } = buildBrowserFetchInit(request, resolve);
    const start = performance.now();
    const res = await fetch(url, { ...init, signal });
    const buf = new Uint8Array(await res.arrayBuffer());
    const time = Math.round(performance.now() - start);

    const contentType = res.headers.get("content-type") || "";
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
        headers[key] = value;
    });

    let data: unknown;
    let encoding: "text" | "base64" = "text";
    if (isTextContentType(contentType)) {
        const text = new TextDecoder("utf-8").decode(buf);
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    } else {
        encoding = "base64";
        data = bytesToBase64(buf);
    }

    return {
        response: {
            status: res.status,
            statusText: res.statusText,
            headers,
            data,
            time,
            size: buf.byteLength,
            contentType,
            encoding,
            requestHeadersSent: headersSent,
            transport: "browser",
        },
    };
}

async function sendViaProxy(
    request: RequestState,
    resolve: ResolveFn,
    mode: SendMode,
    signal?: AbortSignal,
): Promise<SendResult> {
    const payload = buildProxyPayload(request, resolve, DEFAULT_TIMEOUT_MS);
    const proxyUrl = mode === "local" ? LOCAL_PROXY_URL : HOSTED_PROXY_URL;

    let res: Response;
    try {
        res = await fetch(proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal,
        });
    } catch (fetchErr) {
        if (mode === "local" && !(fetchErr instanceof DOMException && fetchErr.name === "AbortError")) {
            throw new Error(
                "Could not reach local proxy at http://127.0.0.1:3927. Run: npm run proxy:local",
            );
        }
        throw fetchErr;
    }

    const data = (await res.json()) as ResponseData & { error?: string };
    const bodyStr =
        typeof data.data === "string"
            ? data.data
            : data.data
              ? JSON.stringify(data.data)
              : data.error || "";

    // Proxy-level failure (bad URL, blocked host, timeout, upstream unreachable)
    if (data.error && (!data.status || (res.status >= 400 && !data.headers))) {
        return { error: explainTransportError(mode, data.error, bodyStr), rawError: data.error };
    }

    // Upstream answered, but if it complains about headers, attach guidance
    let hint: string | undefined;
    if (data.status >= 400 && /x-vercel-id|header/i.test(bodyStr)) {
        const explained = explainTransportError(mode, bodyStr, bodyStr);
        if (explained !== bodyStr) hint = explained;
    }
    return { response: data, error: hint };
}

/**
 * Send a request. Throws AbortError when `signal` aborts; every other failure is
 * returned as `{ error }` with transport-specific guidance.
 */
export async function sendRequest(
    request: RequestState,
    resolve: ResolveFn,
    mode: SendMode,
    signal?: AbortSignal,
): Promise<SendResult> {
    try {
        return mode === "browser"
            ? await sendDirect(request, resolve, signal)
            : await sendViaProxy(request, resolve, mode, signal);
    } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") throw e;
        const message = e instanceof Error ? e.message : "Request failed";
        return { error: explainTransportError(mode, message), rawError: message };
    }
}

const HISTORY_BODY_LIMIT = 64 * 1024;

/**
 * Shrink a response before it goes into localStorage history: binary bodies are
 * dropped and large text bodies cut, so 50 entries can't exhaust the quota.
 */
export function compactResponseForHistory(response: ResponseData): ResponseData {
    if (response.encoding === "base64") {
        return { ...response, data: "", encoding: "text", truncated: true };
    }
    const text = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    if (text && text.length > HISTORY_BODY_LIMIT) {
        return { ...response, data: text.slice(0, HISTORY_BODY_LIMIT), truncated: true };
    }
    return response;
}
