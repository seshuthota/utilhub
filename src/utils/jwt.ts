/**
 * JWT helpers — decode, HS* sign/verify, claims, security warnings.
 * Client-side only (Web Crypto).
 */

export type HsAlg = "HS256" | "HS384" | "HS512";

const HS_HASH: Record<HsAlg, string> = {
    HS256: "SHA-256",
    HS384: "SHA-384",
    HS512: "SHA-512",
};

export const SUPPORTED_HS_ALGS: HsAlg[] = ["HS256", "HS384", "HS512"];

function base64UrlDecode(str: string): string {
    let output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += "==";
            break;
        case 3:
            output += "=";
            break;
        default:
            throw new Error("Illegal base64url string");
    }

    try {
        return decodeURIComponent(
            atob(output)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""),
        );
    } catch {
        return atob(output);
    }
}

function base64UrlEncode(str: string): string {
    try {
        return btoa(unescape(encodeURIComponent(str)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    } catch (e) {
        console.error("Base64 encode failed:", e);
        return "";
    }
}

function formatDuration(diffMs: number): string {
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days === 1 ? "" : "s"}`;
    if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
    if (minutes > 0) return `${minutes} min${minutes === 1 ? "" : "s"}`;
    return `${seconds} sec${seconds === 1 ? "" : "s"}`;
}

export interface JwtDecodeResult {
    header: Record<string, unknown> | null;
    payload: Record<string, unknown> | null;
    signature: string | null;
    error: string | null;
}

export function decodeJwt(token: string): JwtDecodeResult {
    if (!token) return { header: null, payload: null, signature: null, error: null };

    const trimmed = token.trim();
    const parts = trimmed.split(".");

    if (parts.length !== 3) {
        return {
            header: null,
            payload: null,
            signature: null,
            error: "Invalid token structure (must have 3 parts)",
        };
    }

    try {
        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        const signature = parts[2] ?? "";

        return { header, payload, signature, error: null };
    } catch {
        return {
            header: null,
            payload: null,
            signature: null,
            error: "Failed to decode base64 components",
        };
    }
}

export function isJwtExpired(payload: Record<string, unknown> | null | undefined): boolean {
    if (!payload || payload.exp == null) return false;
    const exp = Number(payload.exp);
    if (!Number.isFinite(exp)) return false;
    return Date.now() >= exp * 1000;
}

function resolveHsAlg(alg: unknown): HsAlg | null {
    if (typeof alg !== "string") return null;
    const upper = alg.toUpperCase() as HsAlg;
    return SUPPORTED_HS_ALGS.includes(upper) ? upper : null;
}

async function generateSignature(
    headerB64: string,
    payloadB64: string,
    secret: string,
    alg: HsAlg = "HS256",
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);
    const hash = HS_HASH[alg];

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, data);
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureString = signatureArray.map((b) => String.fromCharCode(b)).join("");

    return btoa(signatureString)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/** Constant-time string compare for equal-length base64url signatures. */
function timingSafeEqualStr(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let out = 0;
    for (let i = 0; i < a.length; i++) {
        out |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return out === 0;
}

export async function signJwt(
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
    secret: string,
): Promise<string | null> {
    try {
        const alg = resolveHsAlg(header.alg) || "HS256";
        const headerToSign = { ...header, alg, typ: header.typ ?? "JWT" };
        const headerStr = base64UrlEncode(JSON.stringify(headerToSign));
        const payloadStr = base64UrlEncode(JSON.stringify(payload));

        if (!secret) return `${headerStr}.${payloadStr}.`;

        const signature = await generateSignature(headerStr, payloadStr, secret, alg);
        return `${headerStr}.${payloadStr}.${signature}`;
    } catch (e) {
        console.error("JWT Signing error:", e);
        return null;
    }
}

export type VerifyStatus =
    | "valid"
    | "invalid"
    | "unsigned"
    | "no_secret"
    | "unsupported_alg"
    | "invalid_token";

export interface VerifyResult {
    status: VerifyStatus;
    valid: boolean;
    reason: string;
    alg?: string;
}

export async function verifyJwtDetailed(
    token: string,
    secret: string,
): Promise<VerifyResult> {
    if (!token?.trim()) {
        return { status: "invalid_token", valid: false, reason: "No token provided" };
    }

    const parts = token.trim().split(".");
    if (parts.length !== 3) {
        return {
            status: "invalid_token",
            valid: false,
            reason: "Invalid token structure",
        };
    }

    if (!parts[2]) {
        return {
            status: "unsigned",
            valid: false,
            reason: "Token has an empty signature",
            alg: undefined,
        };
    }

    if (!secret) {
        return {
            status: "no_secret",
            valid: false,
            reason: "Enter a secret to verify the signature",
        };
    }

    let header: Record<string, unknown>;
    try {
        header = JSON.parse(base64UrlDecode(parts[0]));
    } catch {
        return {
            status: "invalid_token",
            valid: false,
            reason: "Failed to decode header",
        };
    }

    const algRaw = typeof header.alg === "string" ? header.alg : "";
    const alg = resolveHsAlg(algRaw);

    if (algRaw.toLowerCase() === "none" || !algRaw) {
        return {
            status: "unsigned",
            valid: false,
            reason: 'Algorithm is "none" or missing — not a signed token',
            alg: algRaw || "none",
        };
    }

    if (!alg) {
        return {
            status: "unsupported_alg",
            valid: false,
            reason: `Verify supports HS256/HS384/HS512 only (got ${algRaw})`,
            alg: algRaw,
        };
    }

    try {
        const expected = await generateSignature(parts[0], parts[1], secret, alg);
        const valid = timingSafeEqualStr(expected, parts[2]);
        return valid
            ? {
                  status: "valid",
                  valid: true,
                  reason: `Signature valid (${alg})`,
                  alg,
              }
            : {
                  status: "invalid",
                  valid: false,
                  reason: "Signature does not match secret",
                  alg,
              };
    } catch {
        return {
            status: "invalid",
            valid: false,
            reason: "Verification failed",
            alg,
        };
    }
}

/** Back-compat boolean verify (HS* only). */
export async function verifyJwt(token: string, secret: string): Promise<boolean> {
    const result = await verifyJwtDetailed(token, secret);
    return result.valid;
}

export interface ExpirationStatus {
    status: "none" | "expired" | "active";
    text: string;
    isExpired: boolean;
}

export function getExpirationStatus(exp: number): ExpirationStatus {
    if (!exp) return { status: "none", text: "No expiration set", isExpired: false };

    const expMs = exp * 1000;
    const now = Date.now();
    const isExpired = now >= expMs;
    const diff = Math.abs(now - expMs);

    return {
        status: isExpired ? "expired" : "active",
        text: isExpired
            ? `Expired ${formatDuration(diff)} ago`
            : `Expires in ${formatDuration(diff)}`,
        isExpired,
    };
}

export type ClaimName = "iat" | "nbf" | "exp";

export interface ClaimTimeStatus {
    claim: ClaimName;
    label: string;
    raw: number;
    absolute: string;
    relative: string;
    /** true if claim indicates a problem (expired, not yet valid) */
    alert: boolean;
}

export function getClaimTimeStatus(
    claim: ClaimName,
    value: unknown,
    nowMs: number = Date.now(),
): ClaimTimeStatus | null {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return null;

    const ms = raw * 1000;
    const absolute = new Date(ms).toLocaleString();
    const diff = Math.abs(nowMs - ms);
    const duration = formatDuration(diff);

    if (claim === "exp") {
        const isExpired = nowMs >= ms;
        return {
            claim,
            label: "Expires (exp)",
            raw,
            absolute,
            relative: isExpired ? `Expired ${duration} ago` : `Expires in ${duration}`,
            alert: isExpired,
        };
    }

    if (claim === "iat") {
        return {
            claim,
            label: "Issued at (iat)",
            raw,
            absolute,
            relative: nowMs >= ms ? `Issued ${duration} ago` : `Issued in ${duration} (clock skew?)`,
            alert: false,
        };
    }

    // nbf
    const notYet = nowMs < ms;
    return {
        claim,
        label: "Not before (nbf)",
        raw,
        absolute,
        relative: notYet ? `Valid in ${duration}` : `Valid since ${duration} ago`,
        alert: notYet,
    };
}

export function getClaimsTimeline(
    payload: Record<string, unknown> | null | undefined,
    nowMs: number = Date.now(),
): ClaimTimeStatus[] {
    if (!payload) return [];
    const out: ClaimTimeStatus[] = [];
    for (const claim of ["iat", "nbf", "exp"] as ClaimName[]) {
        const status = getClaimTimeStatus(claim, payload[claim], nowMs);
        if (status) out.push(status);
    }
    return out;
}

export type WarningLevel = "danger" | "warning" | "info";

export interface JwtWarning {
    level: WarningLevel;
    message: string;
}

export function getJwtSecurityWarnings(
    header: Record<string, unknown> | null,
    payload: Record<string, unknown> | null,
    signature: string | null,
    nowMs: number = Date.now(),
): JwtWarning[] {
    const warnings: JwtWarning[] = [];
    if (!header && !payload) return warnings;

    const alg = typeof header?.alg === "string" ? header.alg : "";

    if (!alg || alg.toLowerCase() === "none") {
        warnings.push({
            level: "danger",
            message: 'Algorithm is "none" or missing — token is not cryptographically signed.',
        });
    } else if (!resolveHsAlg(alg)) {
        warnings.push({
            level: "info",
            message: `Algorithm "${alg}" — this tool can decode it, but verify only supports HS256/HS384/HS512.`,
        });
    }

    if (signature === "" || signature == null) {
        warnings.push({
            level: "warning",
            message: "Signature segment is empty (unsigned token).",
        });
    }

    if (payload?.nbf != null) {
        const nbf = Number(payload.nbf);
        if (Number.isFinite(nbf) && nowMs < nbf * 1000) {
            warnings.push({
                level: "warning",
                message: "Token is not yet valid (nbf is in the future).",
            });
        }
    }

    if (payload?.exp != null) {
        const exp = Number(payload.exp);
        if (Number.isFinite(exp) && nowMs >= exp * 1000) {
            warnings.push({
                level: "warning",
                message: "Token is expired (exp is in the past).",
            });
        }
    }

    return warnings;
}

export function formatBearerHeader(token: string): string {
    const t = (token || "").trim();
    if (!t) return "";
    return `Authorization: Bearer ${t}`;
}

/** Identity claims for quick display */
export function getIdentityClaims(
    payload: Record<string, unknown> | null | undefined,
): { key: string; value: string }[] {
    if (!payload) return [];
    const keys = ["sub", "iss", "aud", "jti"];
    const out: { key: string; value: string }[] = [];
    for (const key of keys) {
        if (payload[key] == null) continue;
        const v = payload[key];
        out.push({
            key,
            value: Array.isArray(v) ? v.join(", ") : String(v),
        });
    }
    return out;
}
