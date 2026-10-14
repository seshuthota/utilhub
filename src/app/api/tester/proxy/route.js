import { NextResponse } from "next/server";
import { executeProxyRequest } from "@/utils/httpExactProxy";

// In production the hosted proxy must not become a relay into the host's own network.
// Self-hosters who need internal targets can opt out with UTILHUB_PROXY_ALLOW_PRIVATE=1.
const BLOCK_PRIVATE_NETWORKS =
    process.env.NODE_ENV === "production" && process.env.UTILHUB_PROXY_ALLOW_PRIVATE !== "1";
// Vercel caps function responses at ~4.5 MB and the body is returned as JSON/base64.
const MAX_RESPONSE_BYTES = process.env.VERCEL ? 3 * 1024 * 1024 : 10 * 1024 * 1024;

export async function POST(req) {
    try {
        const payload = await req.json();
        const { httpStatus, body } = await executeProxyRequest(payload, {
            transport: "proxy",
            blockPrivateNetworks: BLOCK_PRIVATE_NETWORKS,
            maxResponseBytes: MAX_RESPONSE_BYTES,
            signal: req.signal,
        });
        return NextResponse.json(body, { status: httpStatus });
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
