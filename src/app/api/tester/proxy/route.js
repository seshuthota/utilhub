import { NextResponse } from "next/server";

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_TIMEOUT_MS = 120000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function clampTimeout(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return DEFAULT_TIMEOUT_MS;
    return Math.min(Math.max(Math.floor(n), 1000), MAX_TIMEOUT_MS);
}

function isTextContentType(contentType) {
    const ct = (contentType || "").toLowerCase();
    if (!ct) return true;
    if (ct.startsWith("text/")) return true;
    if (ct.includes("json") || ct.includes("xml") || ct.includes("javascript")) return true;
    if (ct.includes("svg") || ct.includes("yaml") || ct.includes("csv")) return true;
    if (ct.includes("html") || ct.includes("css") || ct.includes("urlencoded")) return true;
    return false;
}

function base64ByteLength(b64) {
    if (!b64) return 0;
    const padding = (b64.match(/=+$/) || [""])[0].length;
    return Math.floor((b64.length * 3) / 4) - padding;
}

async function buildUpstreamBody(bodyMode, body, formFields, headers) {
    const mode = bodyMode || (body ? "raw" : "none");

    if (mode === "none") {
        return { body: undefined, headers };
    }

    if (mode === "json" || mode === "raw") {
        return { body: body || undefined, headers };
    }

    if (mode === "urlencoded") {
        const params = new URLSearchParams();
        let total = 0;
        for (const field of formFields || []) {
            if (!field?.key) continue;
            const value = field.value ?? "";
            total += Buffer.byteLength(String(value), "utf8");
            if (total > MAX_UPLOAD_BYTES) {
                throw new Error(`Request body exceeds ${MAX_UPLOAD_BYTES} byte limit`);
            }
            params.append(field.key, value);
        }
        const nextHeaders = { ...headers };
        if (!Object.keys(nextHeaders).some((k) => k.toLowerCase() === "content-type")) {
            nextHeaders["Content-Type"] = "application/x-www-form-urlencoded";
        }
        return { body: params.toString(), headers: nextHeaders };
    }

    if (mode === "multipart") {
        const form = new FormData();
        let total = 0;

        for (const field of formFields || []) {
            if (!field?.key) continue;

            if (field.type === "file") {
                if (!field.contentBase64) {
                    // Allow empty placeholder (user re-select needed)
                    continue;
                }
                const size = base64ByteLength(field.contentBase64);
                total += size;
                if (total > MAX_UPLOAD_BYTES) {
                    throw new Error(`Request body exceeds ${MAX_UPLOAD_BYTES} byte limit`);
                }
                const buffer = Buffer.from(field.contentBase64, "base64");
                const blob = new Blob([buffer], {
                    type: field.contentType || "application/octet-stream",
                });
                form.append(field.key, blob, field.filename || "file");
            } else {
                const value = field.value ?? "";
                total += Buffer.byteLength(String(value), "utf8");
                if (total > MAX_UPLOAD_BYTES) {
                    throw new Error(`Request body exceeds ${MAX_UPLOAD_BYTES} byte limit`);
                }
                form.append(field.key, value);
            }
        }

        // Let fetch set multipart boundary — strip any Content-Type
        const nextHeaders = { ...headers };
        for (const key of Object.keys(nextHeaders)) {
            if (key.toLowerCase() === "content-type") {
                delete nextHeaders[key];
            }
        }
        return { body: form, headers: nextHeaders };
    }

    return { body: body || undefined, headers };
}

export async function POST(req) {
    try {
        const {
            url,
            method,
            headers: reqHeaders,
            body,
            bodyMode,
            formFields,
            timeoutMs,
        } = await req.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return NextResponse.json(
                { error: "Only http and https URLs are supported" },
                { status: 400 },
            );
        }

        const timeout = clampTimeout(timeoutMs);
        const methodUpper = (method || "GET").toUpperCase();
        let headers = { ...(reqHeaders || {}) };

        let upstreamBody;
        try {
            const built = await buildUpstreamBody(bodyMode, body, formFields, headers);
            upstreamBody = built.body;
            headers = built.headers;
        } catch (e) {
            return NextResponse.json(
                { error: e.message || "Failed to build request body" },
                { status: 400 },
            );
        }

        const options = {
            method: methodUpper,
            headers,
            signal: AbortSignal.timeout(timeout),
        };

        if (methodUpper !== "GET" && methodUpper !== "HEAD" && upstreamBody !== undefined) {
            options.body = upstreamBody;
        }

        const startTime = performance.now();
        let response;
        try {
            response = await fetch(url, options);
        } catch (err) {
            const endTime = performance.now();
            const name = err?.name || "";
            const message = err?.message || "Request failed";

            if (name === "TimeoutError" || name === "AbortError" || /aborted|timeout/i.test(message)) {
                return NextResponse.json(
                    {
                        error: `Request timed out after ${timeout}ms`,
                        status: 408,
                        statusText: "Request Timeout",
                        time: Math.round(endTime - startTime),
                    },
                    { status: 408 },
                );
            }

            return NextResponse.json(
                {
                    error: message,
                    status: 502,
                    statusText: "Bad Gateway",
                    time: Math.round(endTime - startTime),
                },
                { status: 502 },
            );
        }
        const endTime = performance.now();

        const arrayBuffer = await response.arrayBuffer();
        const size = arrayBuffer.byteLength;
        const contentType = response.headers.get("content-type") || "";

        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        let encoding = "text";
        let data;

        if (isTextContentType(contentType)) {
            const text = new TextDecoder("utf-8").decode(arrayBuffer);
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
            encoding = "text";
        } else {
            encoding = "base64";
            data = Buffer.from(arrayBuffer).toString("base64");
        }

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data,
            time: Math.round(endTime - startTime),
            size,
            contentType,
            encoding,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: error.message || "Internal Server Error",
                status: 500,
                statusText: "Internal Server Error",
            },
            { status: 500 },
        );
    }
}
