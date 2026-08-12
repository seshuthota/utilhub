import { NextResponse } from "next/server";
import { executeProxyRequest } from "@/utils/httpExactProxy";

export async function POST(req) {
    try {
        const payload = await req.json();
        const { httpStatus, body } = await executeProxyRequest(payload, {
            transport: "proxy",
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
