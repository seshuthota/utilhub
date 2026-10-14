/**
 * Static syntax highlighting for rendered code blocks, reusing the CodeMirror
 * (Lezer) parsers the editors already ship — no extra highlighter library.
 * Output uses `tok-*` classes from `classHighlighter`; style them in CSS.
 */
import { highlightCode, classHighlighter } from "@lezer/highlight";
import type { Parser } from "@lezer/common";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import { markdown } from "@codemirror/lang-markdown";
import { StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";

const parserFactories: Record<string, () => Parser> = {
    javascript: () => javascript({ jsx: true }).language.parser,
    typescript: () => javascript({ jsx: true, typescript: true }).language.parser,
    json: () => json().language.parser,
    html: () => html().language.parser,
    css: () => css().language.parser,
    sql: () => sql().language.parser,
    yaml: () => yaml().language.parser,
    markdown: () => markdown().language.parser,
    shell: () => StreamLanguage.define(shell).parser,
};

const ALIASES: Record<string, string> = {
    js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript", node: "javascript",
    ts: "typescript", tsx: "typescript",
    jsonc: "json", json5: "json",
    htm: "html", xml: "html", svg: "html", vue: "html",
    scss: "css", less: "css",
    yml: "yaml",
    md: "markdown",
    sh: "shell", bash: "shell", zsh: "shell", console: "shell", shell: "shell",
    postgres: "sql", postgresql: "sql", mysql: "sql", sqlite: "sql",
};

const parsers = new Map<string, Parser>();

function getParser(lang: string): Parser | null {
    const id = ALIASES[lang] ?? lang;
    const factory = parserFactories[id];
    if (!factory) return null;
    if (!parsers.has(id)) parsers.set(id, factory());
    return parsers.get(id)!;
}

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Normalised language id for a fence info string, or "" when unknown. */
export function normalizeLanguage(info: string | undefined): string {
    const lang = (info || "").trim().split(/\s+/)[0].toLowerCase();
    return lang;
}

/**
 * Highlight `code` as `lang`, returning escaped HTML. Unknown languages (or a
 * parser failure) fall back to plain escaped text.
 */
export function highlightToHtml(code: string, lang: string): string {
    const parser = lang ? getParser(lang) : null;
    if (!parser) return escapeHtml(code);
    try {
        let out = "";
        highlightCode(
            code,
            parser.parse(code),
            classHighlighter,
            (text, classes) => {
                out += classes ? `<span class="${classes}">${escapeHtml(text)}</span>` : escapeHtml(text);
            },
            () => {
                out += "\n";
            },
        );
        return out;
    } catch {
        return escapeHtml(code);
    }
}
