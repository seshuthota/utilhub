/**
 * Exact-header HTTP proxy core (shared by Next.js route + local standalone proxy).
 * Sends only client-supplied headers via node:http/https (no fetch/undici defaults).
 */
import http from "node:http";
import https from "node:https";
import { randomBytes } from "node:crypto";
import dns from "node:dns";
import net from "node:net";

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_TIMEOUT_MS = 120000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

function ipv4ToInt(ip) {
    return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const PRIVATE_V4_RANGES = [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16],
    ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
].map(([base, bits]) => [ipv4ToInt(base), bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0]);

/** Loopback, private, link-local (incl. cloud metadata), CGNAT, multicast, reserved. */
export function isPrivateAddress(address) {
    let ip = String(address || "").toLowerCase();
    if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) ip = mapped[1];
    const family = net.isIP(ip);
    if (family === 4) {
        const n = ipv4ToInt(ip);
        return PRIVATE_V4_RANGES.some(([base, mask]) => (n & mask) === (base & mask));
    }
    if (family === 6) {
        return (
            ip === "::" || ip === "::1" ||
            /^f[cd]/.test(ip) ||            // fc00::/7 unique local
            /^fe[89ab]/.test(ip) ||         // fe80::/10 link-local
            /^ff/.test(ip)                  // multicast
        );
    }
    return false;
}

/** dns.lookup wrapper that refuses private targets (checked after resolution, so DNS tricks don't bypass it). */
function publicOnlyLookup(hostname, options, callback) {
    dns.lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err);
        const addresses = Array.isArray(address) ? address.map((a) => a.address) : [address];
        if (addresses.some(isPrivateAddress)) {
            return callback(blockedError(hostname));
        }
        callback(null, address, family);
    });
}

function blockedError(host) {
    return Object.assign(
        new Error(
            `Blocked request to private/internal address (${host}). ` +
                "The hosted proxy only reaches public hosts — use Local proxy (npm run proxy:local) for localhost or internal APIs.",
        ),
        { name: "BlockedAddressError" },
    );
}

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
    const existing = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    if (existing) headers[existing] = value;
    else headers[name] = value;
}

function removeHeader(headers, name) {
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === name.toLowerCase()) delete headers[key];
    }
}

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
            lower === "content-length"
        ) {
            continue;
        }
        clean[key] = String(value);
    }
    return clean;
}

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
        return { body: Buffer.from(params.toString(), "utf8"), headers: nextHeaders };
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

        removeHeader(nextHeaders, "content-type");
        setHeader(nextHeaders, "Content-Type", `multipart/form-data; boundary=${boundary}`);
        return { body: buf, headers: nextHeaders };
    }

    if (body) {
        return { body: Buffer.from(String(body), "utf8"), headers: nextHeaders };
    }
    return { body: undefined, headers: nextHeaders };
}

function exactHeaderRequest(
    parsedUrl,
    { method, headers, body, timeoutMs, blockPrivateNetworks, maxResponseBytes, signal },
) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(Object.assign(new Error("Request aborted"), { name: "AbortError" }));
            return;
        }
        const isHttps = parsedUrl.protocol === "https:";
        const lib = isHttps ? https : http;
        const requestHeaders = { ...(headers || {}) };

        if (body && !hasHeader(requestHeaders, "content-length")) {
            const len = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(String(body));
            setHeader(requestHeaders, "Content-Length", String(len));
        }

        removeHeader(requestHeaders, "transfer-encoding");
        removeHeader(requestHeaders, "connection");
        removeHeader(requestHeaders, "keep-alive");
        removeHeader(requestHeaders, "proxy-connection");

        const req = lib.request(
            {
                protocol: parsedUrl.protocol,
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: `${parsedUrl.pathname}${parsedUrl.search}`,
                method,
                headers: requestHeaders,
                agent: false,
                ...(blockPrivateNetworks ? { lookup: publicOnlyLookup } : {}),
            },
            (res) => {
                const chunks = [];
                let received = 0;
                res.on("data", (chunk) => {
                    received += chunk.length;
                    if (received > maxResponseBytes) {
                        req.destroy(
                            Object.assign(
                                new Error(`Response exceeds the ${(maxResponseBytes / 1024 / 1024).toFixed(1)} MB proxy limit`),
                                { name: "ResponseTooLargeError" },
                            ),
                        );
                        return;
                    }
                    chunks.push(chunk);
                });
                res.on("end", () => {
                    resolve({
                        status: res.statusCode || 0,
                        statusText: res.statusMessage || "",
                        headers: res.headers,
                        body: Buffer.concat(chunks),
                    });
                });
            },
        );

        req.setTimeout(timeoutMs, () => {
            req.destroy(
                Object.assign(new Error(`Request timed out after ${timeoutMs}ms`), {
                    name: "TimeoutError",
                }),
            );
        });
        req.on("error", reject);
        signal?.addEventListener(
            "abort",
            () => req.destroy(Object.assign(new Error("Request aborted"), { name: "AbortError" })),
            { once: true },
        );

        if (body && method !== "GET" && method !== "HEAD") {
            req.write(body);
        }
        req.end();
    });
}

/**
 * @param {object} payload - { url, method, headers, body, bodyMode, formFields, timeoutMs }
 * @param {{ transport?: string, blockPrivateNetworks?: boolean, maxResponseBytes?: number, signal?: AbortSignal }} options
 * @returns {Promise<{ httpStatus: number, body: object }>}
 */
export async function executeProxyRequest(payload, options = {}) {
    const transport = options.transport || "proxy";
    const {
        url,
        method,
        headers: reqHeaders,
        body,
        bodyMode,
        formFields,
        timeoutMs,
    } = payload || {};

    if (!url || typeof url !== "string") {
        return { httpStatus: 400, body: { error: "URL is required" } };
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return { httpStatus: 400, body: { error: "Invalid URL" } };
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return { httpStatus: 400, body: { error: "Only http and https URLs are supported" } };
    }

    if (options.blockPrivateNetworks && (parsedUrl.hostname === "localhost" || isPrivateAddress(parsedUrl.hostname))) {
        return { httpStatus: 403, body: { error: blockedError(parsedUrl.hostname).message } };
    }

    const timeout = clampTimeout(timeoutMs);
    const methodUpper = (method || "GET").toUpperCase();

    let headers = sanitizeOutboundHeaders(reqHeaders || {});
    let upstreamBody;
    try {
        const built = buildUpstreamBody(bodyMode, body, formFields, headers);
        upstreamBody = built.body;
        headers = sanitizeOutboundHeaders(built.headers);
    } catch (e) {
        return {
            httpStatus: 400,
            body: { error: e.message || "Failed to build request body" },
        };
    }

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
            blockPrivateNetworks: Boolean(options.blockPrivateNetworks),
            maxResponseBytes: options.maxResponseBytes || DEFAULT_MAX_RESPONSE_BYTES,
            signal: options.signal,
        });
    } catch (err) {
        const endTime = performance.now();
        const name = err?.name || "";
        const message = err?.message || "Request failed";

        if (name === "BlockedAddressError") {
            return {
                httpStatus: 403,
                body: { error: message, time: Math.round(endTime - startTime), requestHeadersSent, transport },
            };
        }
        if (name === "ResponseTooLargeError") {
            return {
                httpStatus: 502,
                body: { error: message, time: Math.round(endTime - startTime), requestHeadersSent, transport },
            };
        }
        if (name === "TimeoutError" || name === "AbortError" || /aborted|timeout/i.test(message)) {
            return {
                httpStatus: 408,
                body: {
                    error: `Request timed out after ${timeout}ms`,
                    status: 408,
                    statusText: "Request Timeout",
                    time: Math.round(endTime - startTime),
                    requestHeadersSent,
                    transport,
                },
            };
        }

        return {
            httpStatus: 502,
            body: {
                error: message,
                status: 502,
                statusText: "Bad Gateway",
                time: Math.round(endTime - startTime),
                requestHeadersSent,
                transport,
            },
        };
    }
    const endTime = performance.now();

    const arrayBuffer = response.body;
    const size = arrayBuffer.byteLength;
    const responseHeaders = {};
    for (const [key, value] of Object.entries(response.headers || {})) {
        if (value === undefined) continue;
        const lower = key.toLowerCase();
        if (lower === "transfer-encoding" || lower === "connection" || lower === "keep-alive") {
            continue;
        }
        responseHeaders[key] = Array.isArray(value) ? value.join(", ") : String(value);
    }

    const contentType =
        responseHeaders["content-type"] || responseHeaders["Content-Type"] || "";

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

    return {
        httpStatus: 200,
        body: {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data,
            time: Math.round(endTime - startTime),
            size,
            contentType,
            encoding,
            requestHeadersSent,
            transport,
        },
    };
}
