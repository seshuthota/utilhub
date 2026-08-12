import type { BodyMode, FormField, RequestState } from "./apiClientRequest";
import { buildFinalUrl, buildRequestHeaders } from "./apiClientRequest";

export type SnippetLang = "curl" | "fetch" | "python";

function shellQuote(s: string): string {
    return `'${s.replace(/'/g, `'\\''`)}'`;
}

function jsString(s: string): string {
    return JSON.stringify(s);
}

function pyString(s: string): string {
    return JSON.stringify(s);
}

function activeFormFields(fields: FormField[]): FormField[] {
    return (fields || []).filter((f) => f.active !== false && f.key);
}

export function generateSnippets(
    request: RequestState,
    resolve: (text: string) => string = (t) => t,
): Record<SnippetLang, string> {
    const url = buildFinalUrl(request, resolve);
    const headers = buildRequestHeaders(request, resolve);
    const method = request.method || "GET";
    const bodyMode: BodyMode = request.bodyMode || "none";
    const body = request.body ? resolve(request.body) : "";
    const formFields = activeFormFields(request.formFields || []).map((f) => ({
        ...f,
        key: resolve(f.key),
        value: f.type === "file" ? f.value : resolve(f.value || ""),
    }));

    return {
        curl: generateCurl(method, url, headers, bodyMode, body, formFields),
        fetch: generateFetch(method, url, headers, bodyMode, body, formFields),
        python: generatePython(method, url, headers, bodyMode, body, formFields),
    };
}

function generateCurl(
    method: string,
    url: string,
    headers: Record<string, string>,
    bodyMode: BodyMode,
    body: string,
    formFields: FormField[],
): string {
    const lines: string[] = [`curl -X ${method}`];

    Object.entries(headers).forEach(([k, v]) => {
        lines.push(`  -H ${shellQuote(`${k}: ${v}`)}`);
    });

    if (method !== "GET" && method !== "HEAD") {
        if (bodyMode === "json" || bodyMode === "raw") {
            if (body) lines.push(`  -d ${shellQuote(body)}`);
        } else if (bodyMode === "urlencoded") {
            formFields.forEach((f) => {
                lines.push(`  --data-urlencode ${shellQuote(`${f.key}=${f.value || ""}`)}`);
            });
        } else if (bodyMode === "multipart") {
            formFields.forEach((f) => {
                if (f.type === "file") {
                    const name = f.filename || "file";
                    lines.push(`  -F ${shellQuote(`${f.key}=@${name}`)}`);
                } else {
                    lines.push(`  -F ${shellQuote(`${f.key}=${f.value || ""}`)}`);
                }
            });
        }
    }

    lines.push(`  ${shellQuote(url)}`);
    return lines.join(" \\\n");
}

function generateFetch(
    method: string,
    url: string,
    headers: Record<string, string>,
    bodyMode: BodyMode,
    body: string,
    formFields: FormField[],
): string {
    const headerLines = Object.entries(headers)
        .map(([k, v]) => `    ${jsString(k)}: ${jsString(v)}`)
        .join(",\n");

    let bodyLine = "";
    let preamble = "";

    if (method !== "GET" && method !== "HEAD" && bodyMode !== "none") {
        if (bodyMode === "json" || bodyMode === "raw") {
            if (body) bodyLine = `,\n  body: ${jsString(body)}`;
        } else if (bodyMode === "urlencoded") {
            preamble =
                "const body = new URLSearchParams();\n" +
                formFields
                    .map((f) => `body.append(${jsString(f.key)}, ${jsString(f.value || "")});`)
                    .join("\n") +
                "\n\n";
            bodyLine = ",\n  body";
        } else if (bodyMode === "multipart") {
            preamble =
                "const body = new FormData();\n" +
                formFields
                    .map((f) => {
                        if (f.type === "file") {
                            return `// body.append(${jsString(f.key)}, fileInput.files[0]); // select file: ${f.filename || "file"}`;
                        }
                        return `body.append(${jsString(f.key)}, ${jsString(f.value || "")});`;
                    })
                    .join("\n") +
                "\n\n";
            bodyLine = ",\n  body";
        }
    }

    const headersBlock = headerLines
        ? `  headers: {\n${headerLines}\n  }`
        : "  headers: {}";

    return (
        preamble +
        `fetch(${jsString(url)}, {\n` +
        `  method: ${jsString(method)},\n` +
        headersBlock +
        bodyLine +
        `\n})` +
        `\n  .then((res) => res.text())` +
        `\n  .then(console.log)` +
        `\n  .catch(console.error);`
    );
}

function generatePython(
    method: string,
    url: string,
    headers: Record<string, string>,
    bodyMode: BodyMode,
    body: string,
    formFields: FormField[],
): string {
    const headerLines = Object.entries(headers)
        .map(([k, v]) => `    ${pyString(k)}: ${pyString(v)}`)
        .join(",\n");

    const lines: string[] = ["import requests", "", `url = ${pyString(url)}`];

    if (headerLines) {
        lines.push(`headers = {\n${headerLines}\n}`);
    } else {
        lines.push("headers = {}");
    }

    let callArgs = "url, headers=headers";

    if (method !== "GET" && method !== "HEAD" && bodyMode !== "none") {
        if (bodyMode === "json") {
            if (body.trim()) {
                try {
                    JSON.parse(body);
                    lines.push(`payload = ${body}`);
                    callArgs += ", json=payload";
                } catch {
                    lines.push(`payload = ${pyString(body)}`);
                    callArgs += ", data=payload";
                }
            }
        } else if (bodyMode === "raw") {
            if (body) {
                lines.push(`payload = ${pyString(body)}`);
                callArgs += ", data=payload";
            }
        } else if (bodyMode === "urlencoded") {
            const dataLines = formFields
                .map((f) => `    ${pyString(f.key)}: ${pyString(f.value || "")}`)
                .join(",\n");
            lines.push(`data = {\n${dataLines}\n}`);
            callArgs += ", data=data";
        } else if (bodyMode === "multipart") {
            const dataParts: string[] = [];
            const fileParts: string[] = [];
            formFields.forEach((f) => {
                if (f.type === "file") {
                    fileParts.push(
                        `    ${pyString(f.key)}: open(${pyString(f.filename || "file")}, "rb")`,
                    );
                } else {
                    dataParts.push(`    ${pyString(f.key)}: ${pyString(f.value || "")}`);
                }
            });
            if (dataParts.length) {
                lines.push(`data = {\n${dataParts.join(",\n")}\n}`);
                callArgs += ", data=data";
            }
            if (fileParts.length) {
                lines.push(`files = {\n${fileParts.join(",\n")}\n}`);
                callArgs += ", files=files";
            }
        }
    }

    lines.push("");
    lines.push(`response = requests.request(${pyString(method)}, ${callArgs})`);
    lines.push("print(response.status_code)");
    lines.push("print(response.text)");

    return lines.join("\n");
}
