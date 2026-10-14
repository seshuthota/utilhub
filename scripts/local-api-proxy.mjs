#!/usr/bin/env node
/**
 * Local exact-header API proxy for UtilHub API Client.
 *
 * Why: The hosted app runs on Vercel. When the server proxy runs there, some
 * target APIs with strict header allowlists reject platform headers such as
 * x-vercel-id (injected by Vercel on Vercel-hosted targets, or otherwise
 * present in the Vercel→origin path). Browser-direct mode needs CORS.
 *
 * This local proxy runs on your machine (not Vercel), so upstream requests
 * only carry the headers you configured — no Vercel hop.
 *
 * Usage:
 *   npm run proxy:local
 *   # listens on http://127.0.0.1:3927
 *
 * In API Client, set Send via → Local proxy (localhost:3927)
 * Works even when the UtilHub UI is opened from vercel.app (browser → localhost).
 *
 * Only trusted browser origins may use it (localhost + the hosted UtilHub app);
 * otherwise any website you visit could relay requests into your network.
 * Add more with UTILHUB_PROXY_ORIGINS="https://a.example,https://b.example".
 */

import http from "node:http";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load shared core (CJS/ESM interop via dynamic import of the .js file)
const corePath = path.join(__dirname, "../src/utils/httpExactProxy.js");
const { executeProxyRequest } = await import(pathToFileURL(corePath).href);

const PORT = Number(process.env.UTILHUB_PROXY_PORT || 3927);
const HOST = process.env.UTILHUB_PROXY_HOST || "127.0.0.1";

const EXTRA_ORIGINS = (process.env.UTILHUB_PROXY_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
const ALLOWED_ORIGINS = new Set(["https://utilhub-three.vercel.app", ...EXTRA_ORIGINS]);

function isAllowedOrigin(origin) {
    if (!origin) return true; // non-browser clients (curl, scripts) can't be driven by a web page
    if (ALLOWED_ORIGINS.has(origin)) return true;
    try {
        const { protocol, hostname } = new URL(origin);
        return (protocol === "http:" || protocol === "https:") &&
            (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
    } catch {
        return false;
    }
}

function setCors(req, res) {
    const origin = req.headers.origin;
    res.setHeader("Vary", "Origin");
    if (!origin || !isAllowedOrigin(origin)) return;
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    // Chrome Private Network Access: public site (vercel.app) → localhost needs this on preflight
    if (req.headers["access-control-request-private-network"] === "true") {
        res.setHeader("Access-Control-Allow-Private-Network", "true");
    }
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    setCors(req, res);

    if (!isAllowedOrigin(req.headers.origin)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: `Origin ${req.headers.origin} is not allowed. Set UTILHUB_PROXY_ORIGINS to permit it.`,
        }));
        return;
    }

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                ok: true,
                service: "utilhub-local-api-proxy",
                post: "/proxy",
            }),
        );
        return;
    }

    if (req.method === "POST" && (req.url === "/proxy" || req.url === "/")) {
        try {
            const raw = await readBody(req);
            const payload = raw ? JSON.parse(raw) : {};
            const controller = new AbortController();
            res.on("close", () => {
                if (!res.writableFinished) controller.abort();
            });
            const { httpStatus, body } = await executeProxyRequest(payload, {
                transport: "local-proxy",
                signal: controller.signal,
            });
            res.writeHead(httpStatus, { "Content-Type": "application/json" });
            res.end(JSON.stringify(body));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message || "Proxy error" }));
        }
        return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. POST /proxy with the same JSON body as UtilHub." }));
});

server.listen(PORT, HOST, () => {
    console.log("");
    console.log("  UtilHub local API proxy");
    console.log(`  Listening on http://${HOST}:${PORT}`);
    console.log(`  Health:       http://${HOST}:${PORT}/health`);
    console.log(`  Proxy POST:   http://${HOST}:${PORT}/proxy`);
    console.log("");
    console.log("  In API Client: Send via → Local proxy (localhost:3927)");
    console.log(`  Allowed origins: localhost, ${[...ALLOWED_ORIGINS].join(", ")}`);
    console.log("  Keep this process running while you test.");
    console.log("");
});
