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

function setCors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
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
    setCors(res);

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
            const { httpStatus, body } = await executeProxyRequest(payload, {
                transport: "local-proxy",
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
    console.log("  Keep this process running while you test.");
    console.log("");
});
