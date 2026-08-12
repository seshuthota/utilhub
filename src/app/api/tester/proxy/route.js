import { NextResponse } from "next/server";
import http from "node:http";
import https from "node:https";
import { randomBytes } from "node:crypto";

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

function hasHeader(headers, name) {
    const lower = name.toLowerCase();
    return Object.keys(headers || {}).some((k) => k.toLowerCase() === lower);
}

function setHeader(headers, name, value) {
    // Prefer preserving original casing if key already exists
    const existing = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    if (existing) {
        headers[existing] = value;
    } else {
        headers[name] = value;
    }
}

function removeHeader(headers, name) {
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === name.toLowerCase()) {
            delete headers[key];
        }
    }
}

/**
 * Strip platform / hop-by-hop headers that must never be forwarded upstream.
 * Note: if the TARGET is hosted on Vercel, Vercel's edge will still inject
 * x-vercel-id on the inbound request to that deployment — that is outside our control.
 */
function sanitizeOutboundHeaders(headers) {
    const clean = {};
    for (const [key, value] of Object.entries(headers || {})) {
        if (value === undefined || value === null) continue;
        const lower = key.toLowerCase();
        if (
            lower.startsWith("x-vercel-") ||
            lower === "x-forwarded-for" ||
            lower === "x-forwarded-host" ||
            lower === "x-forwarded-proto" ||
            lower === "x-forwarded-port" ||
            lower === "x-real-ip" ||
            lower === "forwarded" ||
            lower === "via" ||
            lower === "transfer-encoding" ||
            lower === "connection" ||
            lower === "keep-alive" ||
            lower === "proxy-connection" ||
            lower === "proxy-authorization" ||
            lower === "te" ||
            lower === "trailer" ||
            lower === "upgrade" ||
            // Never forward the proxy's own content-type from the client→proxy hop
            // (client JSON body uses application/json; upstream is separate)
            lower === "content-length" // we recompute below when body is present
        ) {
            continue;
        }
        clean[key] = String(value);
    }
    return clean;
}

/**
 * Build upstream body using ONLY headers the client provided.
 * Exception: multipart needs a boundary Content-Type to be valid HTTP form data
 * (not an extra tracking/platform header — required for the body encoding).
 */
function buildUpstreamBody(bodyMode, body, formFields, headers) {
    const mode = bodyMode || (body ? "raw" : "none");
    const nextHeaders = { ...(headers || {}) };

    if (mode === "none") {
        return { body: undefined, headers: nextHeaders };
    }

    if (mode === "json" || mode === "raw") {
        if (!body) return { body: undefined, headers: nextHeaders };
        const buf = Buffer.from(String(body), "utf8");
        if (buf.length > MAX_UPLOAD_BYTES) {
            throw new Error(`Request body exceeds ${MAX_UPLOAD_BYTES} byte limit`);
        }
        return { body: buf, headers: nextHeaders };
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
        // Do NOT auto-add Content-Type — only send what the user set
        const buf = Buffer.from(params.toString(), "utf8");
        return { body: buf, headers: nextHeaders };
    }

    if (mode === "multipart") {
        const boundary = `----UtilHubFormBoundary${randomBytes(12).toString("hex")}`;
        const chunks = [];
        let total = 0;

        for (const field of formFields || []) {
            if (!field?.key) continue;

            if (field.type === "file") {
                if (!field.contentBase64) continue;
                const size = base64ByteLength(field.contentBase64);
                total += size;
                if (total > MAX_UPLOAD_BYTES) {
                    throw new Error(`Request body exceeds ${MAX_UPLOAD_BYTES} byte limit`);
                }
                const fileBuf = Buffer.from(field.contentBase64, "base64");
                const filename = (field.filename || "file").replace(/"/g, "");
                const ctype = field.contentType || "application/octet-stream";
                chunks.push(
                    Buffer.from(
                        `--${boundary}\r\n` +
                            `Content-Disposition: form-data; name="${field.key}"; filename="${filename}"\r\n` +
                            `Content-Type: ${ctype}\r\n\r\n`,
                        "utf8",
                    ),
                );
                chunks.push(fileBuf);
                chunks.push(Buffer.from("\r\n", "utf8"));
            } else {
                const value = field.value ?? "";
                total += Buffer.byteLength(String(value), "utf8");
                if (total > MAX_UPLOAD_BYTES) {
                    throw new Error(`Request body exceeds ${MAX_UPLOAD_BYTES} byte limit`);
                }
                chunks.push(
                    Buffer.from(
                        `--${boundary}\r\n` +
                            `Content-Disposition: form-data; name="${field.key}"\r\n\r\n` +
                            `${value}\r\n`,
                        "utf8",
                    ),
                );
            }
        }
        chunks.push(Buffer.from(`--${boundary}--\r\n`, "utf8"));
        const buf = Buffer.concat(chunks);

        // Multipart requires boundary in Content-Type; replace any user CT
        removeHeader(nextHeaders, "content-type");
        setHeader(nextHeaders, "Content-Type", `multipart/form-data; boundary=${boundary}`);

        return { body: buf, headers: nextHeaders };
    }

    if (body) {
        return { body: Buffer.from(String(body), "utf8"), headers: nextHeaders };
    }
    return { body: undefined, headers: nextHeaders };
}

/**
 * Perform HTTP(S) request with exact headers only.
 * Node's http/https modules do not inject Accept / User-Agent like fetch/undici.
 * Host is set by Node from the URL (required by HTTP/1.1) unless the user provided Host.
 */
function exactHeaderRequest(parsedUrl, { method, headers, body, timeoutMs }) {
    return new Promise((resolve, reject) => {
        const isHttps = parsedUrl.protocol === "https:";
        const lib = isHttps ? https : http;

        const requestHeaders = { ...(headers || {}) };

        // Content-Length only when we have a body and user didn't set it
        if (body && !hasHeader(requestHeaders, "content-length")) {
            const len = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(String(body));
            setHeader(requestHeaders, "Content-Length", String(len));
        }

        // Never forward connection-management headers that could confuse intermediaries
        removeHeader(requestHeaders, "transfer-encoding");
        removeHeader(requestHeaders, "connection");
        removeHeader(requestHeaders, "keep-alive");
        removeHeader(requestHeaders, "proxy-connection");

        const options = {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method,
            headers: requestHeaders,
            // No agent pooling — avoids extra Connection: keep-alive from the default agent
            agent: false,
        };

        const req = lib.request(options, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                resolve({
                    status: res.statusCode || 0,
                    statusText: res.statusMessage || "",
                    headers: res.headers,
                    body: Buffer.concat(chunks),
                });
            });
        });

        req.setTimeout(timeoutMs, () => {
            req.destroy(Object.assign(new Error(`Request timed out after ${timeoutMs}ms`), {
                name: "TimeoutError",
            }));
        });

        req.on("error", reject);

        if (body && method !== "GET" && method !== "HEAD") {
            req.write(body);
        }
        req.end();
    });
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

        // Start from client-supplied headers only — never copy inbound proxy request headers
        // (incoming Vercel platform headers like x-vercel-id must not be forwarded)
        let headers = sanitizeOutboundHeaders(reqHeaders || {});

        let upstreamBody;
        try {
            const built = buildUpstreamBody(bodyMode, body, formFields, headers);
            upstreamBody = built.body;
            headers = sanitizeOutboundHeaders(built.headers);
        } catch (e) {
            return NextResponse.json(
                { error: e.message || "Failed to build request body" },
                { status: 400 },
            );
        }

        // Snapshot of headers we intentionally send (before Node adds Host)
        const requestHeadersSent = { ...headers };
        if (upstreamBody && methodUpper !== "GET" && methodUpper !== "HEAD") {
            const len = Buffer.isBuffer(upstreamBody)
                ? upstreamBody.length
                : Buffer.byteLength(String(upstreamBody));
            requestHeadersSent["Content-Length"] = String(len);
        }

        const startTime = performance.now();
        let response;
        try {
            response = await exactHeaderRequest(parsedUrl, {
                method: methodUpper,
                headers,
                body: methodUpper === "GET" || methodUpper === "HEAD" ? undefined : upstreamBody,
                timeoutMs: timeout,
            });
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

        const arrayBuffer = response.body;
        const size = arrayBuffer.byteLength;

        // Node lowercases incoming header names; normalize for the client
        const responseHeaders = {};
        for (const [key, value] of Object.entries(response.headers || {})) {
            if (value === undefined) continue;
            // Skip hop-by-hop / internal framing headers that aren't useful in a client UI
            const lower = key.toLowerCase();
            if (
                lower === "transfer-encoding" ||
                lower === "connection" ||
                lower === "keep-alive"
            ) {
                continue;
            }
            responseHeaders[key] = Array.isArray(value) ? value.join(", ") : String(value);
        }

        const contentType =
            responseHeaders["content-type"] ||
            responseHeaders["Content-Type"] ||
            "";

        let encoding = "text";
        let data;

        if (isTextContentType(contentType)) {
            const text = arrayBuffer.toString("utf8");
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
            encoding = "text";
        } else {
            encoding = "base64";
            data = arrayBuffer.toString("base64");
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
            // Exact headers this proxy set on the upstream request (Host is added by Node HTTP)
            requestHeadersSent,
            transport: "proxy",
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
