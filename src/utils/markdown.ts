/**
 * Markdown Viewer logic: GFM rendering with highlighted code fences, YAML
 * frontmatter, document stats, standalone HTML export and share links.
 * Rendering output is NOT sanitized here — callers pass it through sanitizeHtml.
 */
import { Marked, type Tokens } from "marked";
import yaml from "js-yaml";
import { escapeHtml, highlightToHtml, normalizeLanguage } from "@/utils/codeHighlight";

const md = new Marked({
    gfm: true,
    renderer: {
        code({ text, lang }: Tokens.Code) {
            const language = normalizeLanguage(lang);
            const cls = language ? ` class="language-${escapeHtml(language)}"` : "";
            return `<pre><code${cls}>${highlightToHtml(text.replace(/\n$/, ""), language)}</code></pre>\n`;
        },
    },
});

export function renderMarkdown(source: string): string {
    return md.parse(source, { async: false }) as string;
}

export interface Frontmatter {
    /** Parsed key/values, or null when the block isn't a YAML mapping. */
    data: Record<string, unknown> | null;
    raw: string;
    error?: string;
}

/** Split a leading `---` YAML block from the document body. */
export function splitFrontmatter(source: string): { frontmatter: Frontmatter | null; body: string } {
    const match = source.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/);
    if (!match) return { frontmatter: null, body: source };
    const raw = match[1];
    const body = source.slice(match[0].length);
    try {
        // js-yaml 4's default schema is safe (no custom JS types)
        const parsed = yaml.load(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return { frontmatter: { data: parsed as Record<string, unknown>, raw }, body };
        }
        return { frontmatter: { data: null, raw, error: "Frontmatter is not a key/value mapping" }, body };
    } catch (e) {
        return {
            frontmatter: { data: null, raw, error: e instanceof Error ? e.message.split("\n")[0] : "Invalid YAML" },
            body,
        };
    }
}

export interface DocumentStats {
    words: number;
    characters: number;
    readingMinutes: number;
}

export function documentStats(source: string): DocumentStats {
    const text = source
        .replace(/```[\s\S]*?```/g, " ")       // code blocks don't count as prose
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")   // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
        .replace(/[#>*_`~|-]/g, " ");
    const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    return {
        words,
        characters: source.length,
        readingMinutes: words === 0 ? 0 : Math.max(1, Math.round(words / 200)),
    };
}

/** First heading (or frontmatter title) as a safe file name stem. */
export function documentTitle(source: string, frontmatter: Frontmatter | null): string {
    const fmTitle = frontmatter?.data?.title;
    const heading = source.match(/^#{1,6}\s+(.+)$/m)?.[1];
    const title = (typeof fmTitle === "string" && fmTitle) || heading || "document";
    return title.replace(/[`*_[\]]/g, "").trim() || "document";
}

export function fileStem(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "document";
}

const EXPORT_CSS = `
:root{color-scheme:light dark;--fg:#1f2328;--muted:#59636e;--bg:#fff;--border:#d1d9e0;--code-bg:#f6f8fa;--accent:#0969da}
@media (prefers-color-scheme:dark){:root{--fg:#e6edf3;--muted:#9198a1;--bg:#0d1117;--border:#3d444d;--code-bg:#151b23;--accent:#4493f8}}
*{box-sizing:border-box}
body{margin:0 auto;max-width:860px;padding:2.5rem 1.5rem;font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg)}
h1,h2,h3,h4,h5,h6{line-height:1.25;margin:1.5em 0 .6em}
h1{font-size:2em;border-bottom:1px solid var(--border);padding-bottom:.3em}
h2{font-size:1.5em;border-bottom:1px solid var(--border);padding-bottom:.3em}
a{color:var(--accent)}
img{max-width:100%}
hr{border:0;border-top:1px solid var(--border);margin:2em 0}
blockquote{margin:0 0 1em;padding:0 1em;color:var(--muted);border-left:.25em solid var(--border)}
table{border-collapse:collapse;margin:0 0 1em;display:block;overflow:auto}
th,td{border:1px solid var(--border);padding:.4em .8em}
th{background:var(--code-bg)}
code{font:.875em/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--code-bg);padding:.15em .35em;border-radius:4px}
pre{background:var(--code-bg);padding:1em;border-radius:6px;overflow:auto}
pre code{background:none;padding:0}
li:has(>input[type=checkbox]){list-style:none}
li>input[type=checkbox]{margin:0 .5em 0 -1.4em}
.frontmatter{font-size:.85em;margin:0 0 2em}
.frontmatter th{text-align:left;width:1%;white-space:nowrap}
.tok-keyword,.tok-operator{color:#cf222e}.tok-string,.tok-string2{color:#0a3069}.tok-number,.tok-bool,.tok-atom{color:#0550ae}
.tok-comment{color:#6e7781;font-style:italic}.tok-typeName,.tok-className{color:#953800}.tok-definition,.tok-propertyName{color:#8250df}
.tok-variableName{color:inherit}.tok-meta,.tok-heading{color:#0550ae;font-weight:600}
@media (prefers-color-scheme:dark){.tok-keyword,.tok-operator{color:#ff7b72}.tok-string,.tok-string2{color:#a5d6ff}.tok-number,.tok-bool,.tok-atom{color:#79c0ff}.tok-comment{color:#8b949e}.tok-typeName,.tok-className{color:#ffa657}.tok-definition,.tok-propertyName{color:#d2a8ff}.tok-meta,.tok-heading{color:#79c0ff}}
@media print{body{max-width:none;padding:0}pre,blockquote,table,img{break-inside:avoid}a{color:inherit}}
`;

/** A self-contained HTML document (inline CSS, no scripts) for download or print. */
export function buildHtmlDocument(bodyHtml: string, title: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(title)}</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

/** HTML table for frontmatter (values escaped; nested values shown as JSON). */
export function frontmatterTable(data: Record<string, unknown>): string {
    const rows = Object.entries(data)
        .map(([key, value]) => {
            const shown = value instanceof Date
                ? value.toISOString().slice(0, 10)
                : typeof value === "object" && value !== null
                  ? JSON.stringify(value)
                  : String(value);
            return `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(shown)}</td></tr>`;
        })
        .join("");
    return `<table class="frontmatter"><tbody>${rows}</tbody></table>`;
}

// ---------------------------------------------------------------------------
// Share links: the document goes in the URL fragment (never sent to a server),
// deflate-compressed when the browser supports CompressionStream.
// ---------------------------------------------------------------------------

export const SHARE_KEY = "md";

function toBase64Url(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
    const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
    const out = new Response(bytes as BodyInit).body!.pipeThrough(stream);
    return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeShare(source: string): Promise<string> {
    const bytes = new TextEncoder().encode(source);
    if (typeof CompressionStream !== "undefined") {
        return `z.${toBase64Url(await pipe(bytes, new CompressionStream("deflate-raw")))}`;
    }
    return `u.${toBase64Url(bytes)}`;
}

export async function decodeShare(token: string): Promise<string | null> {
    try {
        const [kind, data] = [token.slice(0, 2), token.slice(2)];
        const bytes = fromBase64Url(data);
        if (kind === "u.") return new TextDecoder().decode(bytes);
        if (kind === "z." && typeof DecompressionStream !== "undefined") {
            return new TextDecoder().decode(await pipe(bytes, new DecompressionStream("deflate-raw")));
        }
        return null;
    } catch {
        return null;
    }
}

export function readShareToken(hash: string): string | null {
    return new URLSearchParams(hash.replace(/^#/, "")).get(SHARE_KEY);
}
