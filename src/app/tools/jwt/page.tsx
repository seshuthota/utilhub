'use client';

import { useState, useMemo, useEffect } from "react";
import {
    Key,
    Copy,
    Clock,
    ShieldCheck,
    ShieldAlert,
    PenTool,
    Lock,
    AlertTriangle,
    Eye,
    EyeOff,
} from "lucide-react";
import { useUrlState } from "@/hooks/useUrlState";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToast } from "@/components/Toast";
import {
    decodeJwt,
    getExpirationStatus,
    signJwt,
    verifyJwtDetailed,
    getClaimsTimeline,
    getJwtSecurityWarnings,
    formatBearerHeader,
    getIdentityClaims,
    type VerifyResult,
} from "@/utils/jwt";
import ShareButton from "@/components/common/ShareButton";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import ActionToolbar from "@/components/common/ActionToolbar";
import styles from "./page.module.css";

const defaultHeader = {
    alg: "HS256",
    typ: "JWT",
};

const defaultPayload = {
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
};

export default function JwtTool() {
    const [token, setToken] = useUrlState("token", "");
    const [mode, setMode] = useState<"decode" | "sign">("decode");
    const [headerInput, setHeaderInput] = useState(JSON.stringify(defaultHeader, null, 2));
    const [payloadInput, setPayloadInput] = useState(JSON.stringify(defaultPayload, null, 2));
    const [secret, setSecret] = useState("");
    const [signSecret, setSignSecret] = useState("");
    const [signedToken, setSignedToken] = useState("");
    const [showSecret, setShowSecret] = useState(false);
    const [showSignSecret, setShowSignSecret] = useState(false);
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [verifying, setVerifying] = useState(false);

    const { showToast } = useToast();

    const { header, payload, signature, error } = useMemo(
        () => decodeJwt(token),
        [token],
    );

    const expiration = useMemo(() => {
        if (!payload || payload.exp == null) return null;
        return getExpirationStatus(Number(payload.exp));
    }, [payload]);

    const claims = useMemo(() => getClaimsTimeline(payload), [payload]);
    const warnings = useMemo(
        () => getJwtSecurityWarnings(header, payload, signature),
        [header, payload, signature],
    );
    const identity = useMemo(() => getIdentityClaims(payload), [payload]);

    // Async verify when token or secret changes
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!token.trim()) {
                setVerifyResult(null);
                setVerifying(false);
                return;
            }

            const parts = token.trim().split(".");
            if (parts.length === 3 && !parts[2]) {
                setVerifyResult({
                    status: "unsigned",
                    valid: false,
                    reason: "Token has an empty signature",
                });
                setVerifying(false);
                return;
            }

            if (!secret) {
                setVerifyResult({
                    status: "no_secret",
                    valid: false,
                    reason: "Enter a secret to verify the signature",
                });
                setVerifying(false);
                return;
            }

            setVerifying(true);
            const result = await verifyJwtDetailed(token, secret);
            if (!cancelled) {
                setVerifyResult(result);
                setVerifying(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [token, secret]);

    const handleSign = async () => {
        try {
            const h = JSON.parse(headerInput);
            const p = JSON.parse(payloadInput);
            const result = await signJwt(h, p, signSecret);
            if (result) {
                setSignedToken(result);
                showToast(
                    signSecret ? "Token signed successfully" : "Token created without signature",
                    "success",
                );
            } else {
                showToast("Failed to sign token", "error");
            }
        } catch {
            showToast("Invalid JSON in Header or Payload", "error");
        }
    };

    const copyToClipboard = (text: unknown, label: string) => {
        if (text == null || text === "") return;
        const value =
            typeof text === "object" ? JSON.stringify(text, null, 2) : String(text);
        navigator.clipboard.writeText(value);
        showToast(`${label} copied`, "success");
    };

    const copyBearer = (t: string) => {
        const headerLine = formatBearerHeader(t);
        if (!headerLine) {
            showToast("Nothing to copy", "error");
            return;
        }
        navigator.clipboard.writeText(headerLine);
        showToast("Bearer header copied", "success");
    };

    useHotkeys("c", () => copyToClipboard(payload, "Payload"), { meta: true, shift: true });

    const signatureStatusClass =
        verifyResult?.status === "valid"
            ? styles.active
            : verifyResult?.status === "invalid" || verifyResult?.status === "unsigned"
              ? styles.expired
              : styles.neutral;

    const signatureLabel = verifying
        ? "Checking…"
        : !token.trim()
          ? "—"
          : verifyResult?.status === "valid"
            ? "Signature valid"
            : verifyResult?.status === "invalid"
              ? "Signature invalid"
              : verifyResult?.status === "unsigned"
                ? "Unsigned"
                : verifyResult?.status === "unsupported_alg"
                  ? "Unsupported alg"
                  : "Not verified";

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JWT Tool</h1>
                <ShareButton />
            </header>

            <div className={styles.tabs} role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "decode"}
                    className={`${styles.tab} ${mode === "decode" ? styles.activeTab : ""}`}
                    onClick={() => setMode("decode")}
                >
                    <ShieldCheck size={16} aria-hidden /> Decoder
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "sign"}
                    className={`${styles.tab} ${mode === "sign" ? styles.activeTab : ""}`}
                    onClick={() => setMode("sign")}
                >
                    <PenTool size={16} aria-hidden /> Signer
                </button>
            </div>

            {mode === "decode" ? (
                <div className={styles.grid}>
                    <div className={styles.column}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <Key size={16} aria-hidden /> Encoded Token
                                </span>
                                <div className={styles.headerActions}>
                                    <button
                                        type="button"
                                        className={styles.copyBtn}
                                        onClick={() => copyToClipboard(token, "Token")}
                                        title="Copy token"
                                        aria-label="Copy token"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.textBtn}
                                        onClick={() => copyBearer(token)}
                                        title="Copy as Authorization: Bearer …"
                                        disabled={!token.trim()}
                                    >
                                        Copy Bearer
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className={styles.inputArea}
                                placeholder="Paste your JWT here (eyJ...)"
                                spellCheck={false}
                                aria-label="JWT token"
                            />
                        </div>

                        <div className={styles.card} style={{ flex: "0 0 auto" }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <Lock size={16} aria-hidden /> Secret (optional)
                                </span>
                                <button
                                    type="button"
                                    className={styles.copyBtn}
                                    onClick={() => setShowSecret((s) => !s)}
                                    title={showSecret ? "Hide secret" : "Show secret"}
                                    aria-label={showSecret ? "Hide secret" : "Show secret"}
                                >
                                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <input
                                type={showSecret ? "text" : "password"}
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className={styles.secretInput}
                                placeholder="Enter HMAC secret to verify signature…"
                                autoComplete="off"
                                spellCheck={false}
                                aria-label="HMAC secret for verification"
                            />
                        </div>

                        {(token.trim() || expiration) && (
                            <div className={styles.statusSection}>
                                <div
                                    className={`${styles.statusCard} ${signatureStatusClass}`}
                                    aria-live="polite"
                                >
                                    <div className={styles.statusIcon}>
                                        {verifyResult?.status === "valid" ? (
                                            <ShieldCheck size={18} aria-hidden />
                                        ) : verifyResult?.status === "invalid" ||
                                          verifyResult?.status === "unsigned" ? (
                                            <ShieldAlert size={18} aria-hidden />
                                        ) : (
                                            <Key size={18} aria-hidden />
                                        )}
                                    </div>
                                    <div className={styles.statusInfo}>
                                        <span className={styles.statusLabel}>Signature</span>
                                        <span className={styles.statusValue}>{signatureLabel}</span>
                                        {verifyResult?.reason && token.trim() && (
                                            <span className={styles.statusHint}>
                                                {verifyResult.reason}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {expiration && (
                                    <div
                                        className={`${styles.statusCard} ${
                                            expiration.isExpired ? styles.expired : styles.active
                                        }`}
                                    >
                                        <div className={styles.statusIcon}>
                                            <Clock size={18} aria-hidden />
                                        </div>
                                        <div className={styles.statusInfo}>
                                            <span className={styles.statusLabel}>Expiration</span>
                                            <span className={styles.statusValue}>
                                                {expiration.text}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {claims.length > 0 && (
                            <div className={styles.claimsCard}>
                                <div className={styles.claimsTitle}>Time claims</div>
                                <div className={styles.claimsList}>
                                    {claims.map((c) => (
                                        <div
                                            key={c.claim}
                                            className={`${styles.claimRow} ${
                                                c.alert ? styles.claimAlert : ""
                                            }`}
                                        >
                                            <span className={styles.claimLabel}>{c.label}</span>
                                            <span className={styles.claimRelative}>{c.relative}</span>
                                            <span className={styles.claimAbsolute}>{c.absolute}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {identity.length > 0 && (
                            <div className={styles.claimsCard}>
                                <div className={styles.claimsTitle}>Identity claims</div>
                                <div className={styles.claimsList}>
                                    {identity.map((c) => (
                                        <div key={c.key} className={styles.claimRow}>
                                            <span className={styles.claimLabel}>{c.key}</span>
                                            <span className={styles.claimRelative}>{c.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.column}>
                        {warnings.length > 0 && (
                            <div className={styles.warnings} role="status">
                                {warnings.map((w, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.warningItem} ${styles[`warn_${w.level}`]}`}
                                    >
                                        <AlertTriangle size={14} aria-hidden />
                                        <span>{w.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.card} style={{ flex: 1 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Header</span>
                                <ActionToolbar
                                    content={header ? JSON.stringify(header, null, 2) : ""}
                                    currentToolId="jwt"
                                />
                            </div>
                            <pre className={styles.jsonContent}>
                                {header ? (
                                    JSON.stringify(header, null, 2)
                                ) : (
                                    <div className={styles.placeholder}>Waiting for token...</div>
                                )}
                            </pre>
                        </div>

                        <div className={styles.card} style={{ flex: 2 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Payload</span>
                                <ActionToolbar
                                    content={payload ? JSON.stringify(payload, null, 2) : ""}
                                    currentToolId="jwt"
                                />
                            </div>
                            <pre className={styles.jsonContent}>
                                {payload ? (
                                    JSON.stringify(payload, null, 2)
                                ) : (
                                    <div className={styles.placeholder}>Waiting for token...</div>
                                )}
                            </pre>
                        </div>

                        {error && (
                            <div className={styles.errorBox} role="alert">
                                Error: {error}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className={styles.grid}>
                    <div className={styles.column}>
                        <div className={styles.card} style={{ flex: 1 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Header (JSON)</span>
                            </div>
                            <div className={styles.editorContainer}>
                                <CodeMirrorEditor
                                    value={headerInput}
                                    onChange={setHeaderInput}
                                    language="json"
                                />
                            </div>
                        </div>
                        <div className={styles.card} style={{ flex: 2 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Payload (JSON)</span>
                            </div>
                            <div className={styles.editorContainer}>
                                <CodeMirrorEditor
                                    value={payloadInput}
                                    onChange={setPayloadInput}
                                    language="json"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <div className={styles.card} style={{ flex: "0 0 auto" }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <Lock size={16} aria-hidden /> Secret Key
                                </span>
                                <button
                                    type="button"
                                    className={styles.copyBtn}
                                    onClick={() => setShowSignSecret((s) => !s)}
                                    title={showSignSecret ? "Hide secret" : "Show secret"}
                                    aria-label={showSignSecret ? "Hide secret" : "Show secret"}
                                >
                                    {showSignSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <input
                                type={showSignSecret ? "text" : "password"}
                                value={signSecret}
                                onChange={(e) => setSignSecret(e.target.value)}
                                className={styles.secretInput}
                                placeholder="Enter secret to sign (HS256/384/512)…"
                                autoComplete="off"
                                spellCheck={false}
                                aria-label="HMAC secret for signing"
                            />
                        </div>

                        <button type="button" onClick={handleSign} className={styles.signBtn}>
                            <PenTool size={16} aria-hidden /> Sign Token
                        </button>

                        <div className={styles.card} style={{ flex: 1 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Signed Token</span>
                                <div className={styles.headerActions}>
                                    <button
                                        type="button"
                                        className={styles.copyBtn}
                                        onClick={() => copyToClipboard(signedToken, "Token")}
                                        title="Copy token"
                                        aria-label="Copy signed token"
                                        disabled={!signedToken}
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.textBtn}
                                        onClick={() => copyBearer(signedToken)}
                                        title="Copy as Authorization: Bearer …"
                                        disabled={!signedToken}
                                    >
                                        Copy Bearer
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={signedToken}
                                readOnly
                                className={styles.inputArea}
                                placeholder="Generated token will appear here..."
                                aria-label="Signed JWT output"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
