/**
 * Parses a cURL command and extracts method, URL, headers, body, and form fields.
 * Supports common cURL flags: -X, -H, -d, --data, --data-raw, --data-urlencode, -F, --form, -u
 */

/**
 * Returns true when text looks like a cURL command (for auto-import on paste).
 * Accepts leading whitespace and multi-line commands starting with curl.
 */
export function isCurlCommand(text) {
    if (!text || typeof text !== "string") return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    // Starts with curl (optionally with line breaks after)
    if (/^curl(\s|$)/i.test(trimmed)) return true;
    // Multi-line paste where first non-empty line is curl
    const firstLine = trimmed.split(/\r?\n/).find((l) => l.trim()) || "";
    return /^curl(\s|$)/i.test(firstLine.trim());
}

/** Extract a quoted or bare token starting at index. Returns { value, end }. */
function readToken(str, start) {
    let i = start;
    while (i < str.length && /\s/.test(str[i])) i++;
    if (i >= str.length) return { value: "", end: i };

    const quote = str[i];
    if (quote === "'" || quote === '"') {
        i++;
        let value = "";
        while (i < str.length) {
            if (str[i] === "\\" && quote === '"' && i + 1 < str.length) {
                value += str[i + 1];
                i += 2;
                continue;
            }
            if (str[i] === quote) {
                return { value, end: i + 1 };
            }
            value += str[i];
            i++;
        }
        return { value, end: i };
    }

    let value = "";
    while (i < str.length && !/\s/.test(str[i])) {
        value += str[i];
        i++;
    }
    return { value, end: i };
}

function extractFlagValues(normalized, flagPattern) {
    const results = [];
    const re = new RegExp(flagPattern, "gi");
    let match;
    while ((match = re.exec(normalized)) !== null) {
        const { value, end } = readToken(normalized, match.index + match[0].length);
        if (value) results.push(value);
        re.lastIndex = Math.max(end, match.index + 1);
    }
    return results;
}

export function parseCurl(curlString) {
    if (!curlString || typeof curlString !== "string") {
        return { error: "Invalid cURL command" };
    }

    const normalized = curlString
        .replace(/\\\r?\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!normalized.toLowerCase().startsWith("curl")) {
        return { error: 'Command must start with "curl"' };
    }

    let method = "GET";
    let url = "";
    const headers = [];
    let body = "";
    let auth = { type: "none" };
    let bodyMode = "none";
    const formFields = [];

    const methodMatch = normalized.match(/-X\s+['"]?(\w+)['"]?/i);
    if (methodMatch) {
        method = methodMatch[1].toUpperCase();
    }

    // URL
    const urlRegex = /['"]?(https?:\/\/[^\s'"]+)['"]?/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(normalized)) !== null) {
        url = urlMatch[1].replace(/['"]$/, "");
    }
    if (!url) {
        const parts = normalized.split(/\s+/);
        for (const part of parts) {
            if (part.startsWith("http://") || part.startsWith("https://")) {
                url = part.replace(/['"]/g, "");
                break;
            }
        }
    }

    // Headers
    for (const headerStr of extractFlagValues(normalized, String.raw`-H\s+`)) {
        const colonIndex = headerStr.indexOf(":");
        if (colonIndex > 0) {
            headers.push({
                key: headerStr.substring(0, colonIndex).trim(),
                value: headerStr.substring(colonIndex + 1).trim(),
                active: true,
            });
        }
    }

    // Multipart (-F / --form)
    const formValues = [
        ...extractFlagValues(normalized, String.raw`(?:-F|--form)\s+`),
    ];
    for (const part of formValues) {
        const eq = part.indexOf("=");
        if (eq <= 0) continue;
        const key = part.slice(0, eq).trim();
        let value = part.slice(eq + 1).trim();
        let type = "text";
        let filename;
        if (value.startsWith("@")) {
            type = "file";
            filename = value.slice(1);
            value = filename;
        }
        formFields.push({ key, value, type, active: true, filename });
        bodyMode = "multipart";
        if (method === "GET") method = "POST";
    }

    // urlencoded (--data-urlencode)
    const urlencodeValues = extractFlagValues(normalized, String.raw`--data-urlencode\s+`);
    if (urlencodeValues.length > 0 && bodyMode !== "multipart") {
        bodyMode = "urlencoded";
        for (const part of urlencodeValues) {
            const eq = part.indexOf("=");
            if (eq > 0) {
                formFields.push({
                    key: part.slice(0, eq),
                    value: part.slice(eq + 1),
                    type: "text",
                    active: true,
                });
            } else {
                formFields.push({ key: part, value: "", type: "text", active: true });
            }
        }
        if (method === "GET") method = "POST";
    }

    // Body (-d / --data / --data-raw)
    if (bodyMode === "none") {
        const dataValues = extractFlagValues(
            normalized,
            String.raw`(?:-d|--data-raw|--data)\s+`,
        );
        if (dataValues.length > 0) {
            body = dataValues.join("");
            if (method === "GET") method = "POST";

            const trimmed = body.trim();
            let isJson = false;
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                try {
                    JSON.parse(trimmed);
                    isJson = true;
                } catch {
                    isJson = false;
                }
            }

            if (isJson) {
                bodyMode = "json";
            } else if (
                body.includes("=") &&
                !trimmed.startsWith("{") &&
                !trimmed.startsWith("[") &&
                !trimmed.includes("\n")
            ) {
                bodyMode = "urlencoded";
                formFields.length = 0;
                for (const pair of body.split("&")) {
                    const eq = pair.indexOf("=");
                    if (eq > 0) {
                        try {
                            formFields.push({
                                key: decodeURIComponent(pair.slice(0, eq)),
                                value: decodeURIComponent(pair.slice(eq + 1)),
                                type: "text",
                                active: true,
                            });
                        } catch {
                            formFields.push({
                                key: pair.slice(0, eq),
                                value: pair.slice(eq + 1),
                                type: "text",
                                active: true,
                            });
                        }
                    }
                }
                body = "";
            } else {
                bodyMode = "raw";
            }
        }
    }

    // Basic auth
    const authMatch = normalized.match(/-u\s+['"]?([^:'\s]+):([^'\s]+)['"]?/i);
    if (authMatch) {
        auth = {
            type: "basic",
            username: authMatch[1],
            password: authMatch[2],
        };
    }

    // Bearer from Authorization header
    const authHeader = headers.find((h) => h.key.toLowerCase() === "authorization");
    if (authHeader) {
        const bearerMatch = authHeader.value.match(/^Bearer\s+(.+)$/i);
        if (bearerMatch) {
            auth = { type: "bearer", token: bearerMatch[1] };
            headers.splice(headers.indexOf(authHeader), 1);
        }
    }

    if (!url) {
        return { error: "Could not find URL in cURL command" };
    }

    let params = [];
    try {
        const qIndex = url.indexOf("?");
        if (qIndex !== -1) {
            const qs = url.slice(qIndex + 1);
            const sp = new URLSearchParams(qs);
            params = Array.from(sp.entries()).map(([key, value]) => ({
                key,
                value,
                active: true,
            }));
        }
    } catch {
        params = [];
    }

    return {
        method,
        url,
        headers,
        body,
        auth,
        bodyMode,
        formFields,
        params,
    };
}
