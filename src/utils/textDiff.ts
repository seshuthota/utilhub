import {
    diffArrays,
    diffWordsWithSpace,
    diffChars,
    createTwoFilesPatch,
} from "diff";

export type DiffGranularity = "lines" | "words" | "chars";
export type DiffViewMode = "split" | "unified";

export interface DiffOptions {
    granularity?: DiffGranularity;
    ignoreWhitespace?: boolean;
    ignoreCase?: boolean;
}

export interface InnerPart {
    text: string;
    type: "equal" | "add" | "del";
}

export interface DiffRow {
    type: "equal" | "add" | "del" | "change" | "collapse";
    leftNum: number | null;
    rightNum: number | null;
    left: string;
    right: string;
    leftParts?: InnerPart[];
    rightParts?: InnerPart[];
    hiddenCount?: number;
}

export interface DiffStats {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
}

export interface DiffResult {
    rows: DiffRow[];
    stats: DiffStats;
    patch: string;
}

function normalizeForCompare(line: string, opts: DiffOptions): string {
    let s = line;
    if (opts.ignoreCase) s = s.toLowerCase();
    if (opts.ignoreWhitespace) s = s.replace(/[ \t]+/g, " ").replace(/[ \t]+$/g, "");
    return s;
}

function splitLines(text: string): string[] {
    if (text === "") return [""];
    const lines = text.split("\n");
    if (lines.length > 1 && lines[lines.length - 1] === "") {
        lines.pop();
    }
    return lines;
}

function innerParts(
    oldLine: string,
    newLine: string,
    granularity: DiffGranularity,
    opts: DiffOptions,
): { left: InnerPart[]; right: InnerPart[] } {
    const fn = granularity === "chars" ? diffChars : diffWordsWithSpace;
    const changes = fn(oldLine, newLine, {
        ignoreCase: opts.ignoreCase,
    });
    const left: InnerPart[] = [];
    const right: InnerPart[] = [];
    for (const c of changes) {
        if (c.added) {
            right.push({ text: c.value, type: "add" });
        } else if (c.removed) {
            left.push({ text: c.value, type: "del" });
        } else {
            left.push({ text: c.value, type: "equal" });
            right.push({ text: c.value, type: "equal" });
        }
    }
    return { left, right };
}

function computeLineRows(oldText: string, newText: string, opts: DiffOptions): DiffRow[] {
    const oldLines = splitLines(oldText);
    const newLines = splitLines(newText);

    const changes = diffArrays(oldLines, newLines, {
        comparator: (a, b) => normalizeForCompare(a, opts) === normalizeForCompare(b, opts),
    });

    const rows: DiffRow[] = [];
    let leftN = 1;
    let rightN = 1;
    let pendingDel: string[] = [];

    const flushPendingWithAdds = (adds: string[]) => {
        const pair = Math.min(pendingDel.length, adds.length);
        for (let i = 0; i < pair; i++) {
            const inner = innerParts(pendingDel[i], adds[i], "words", opts);
            rows.push({
                type: "change",
                leftNum: leftN++,
                rightNum: rightN++,
                left: pendingDel[i],
                right: adds[i],
                leftParts: inner.left,
                rightParts: inner.right,
            });
        }
        for (let i = pair; i < pendingDel.length; i++) {
            rows.push({
                type: "del",
                leftNum: leftN++,
                rightNum: null,
                left: pendingDel[i],
                right: "",
            });
        }
        for (let i = pair; i < adds.length; i++) {
            rows.push({
                type: "add",
                leftNum: null,
                rightNum: rightN++,
                left: "",
                right: adds[i],
            });
        }
        pendingDel = [];
    };

    for (const change of changes) {
        const lines = change.value as string[];
        if (change.removed) {
            pendingDel.push(...lines);
            continue;
        }
        if (change.added) {
            flushPendingWithAdds(lines);
            continue;
        }
        if (pendingDel.length) flushPendingWithAdds([]);
        for (const line of lines) {
            rows.push({
                type: "equal",
                leftNum: leftN++,
                rightNum: rightN++,
                left: line,
                right: line,
            });
        }
    }
    if (pendingDel.length) flushPendingWithAdds([]);

    return rows;
}

function computeInlineRows(
    oldText: string,
    newText: string,
    granularity: "words" | "chars",
    opts: DiffOptions,
): DiffRow[] {
    const fn = granularity === "chars" ? diffChars : diffWordsWithSpace;
    const changes = fn(oldText, newText, { ignoreCase: opts.ignoreCase });

    // Flatten to a single stream of tokens, then split into visual lines
    type Tok = { text: string; type: "equal" | "add" | "del" };
    const tokens: Tok[] = [];
    for (const c of changes) {
        const type: Tok["type"] = c.added ? "add" : c.removed ? "del" : "equal";
        tokens.push({ text: c.value, type });
    }

    const rows: DiffRow[] = [];
    let leftN = 1;
    let rightN = 1;
    let leftParts: InnerPart[] = [];
    let rightParts: InnerPart[] = [];
    let leftText = "";
    let rightText = "";
    let sawDel = false;
    let sawAdd = false;

    const flush = () => {
        if (!leftParts.length && !rightParts.length) return;
        const type: DiffRow["type"] =
            sawDel && sawAdd ? "change" : sawAdd ? "add" : sawDel ? "del" : "equal";
        rows.push({
            type,
            leftNum: type === "add" ? null : leftN++,
            rightNum: type === "del" ? null : rightN++,
            left: leftText,
            right: rightText,
            leftParts,
            rightParts,
        });
        leftParts = [];
        rightParts = [];
        leftText = "";
        rightText = "";
        sawDel = false;
        sawAdd = false;
    };

    for (const tok of tokens) {
        const segs = tok.text.split("\n");
        for (let i = 0; i < segs.length; i++) {
            if (i > 0) flush();
            if (segs[i] === "" && i < segs.length - 1) continue;
            if (tok.type !== "add") {
                leftParts.push({ text: segs[i], type: tok.type === "del" ? "del" : "equal" });
                leftText += segs[i];
                if (tok.type === "del") sawDel = true;
            }
            if (tok.type !== "del") {
                rightParts.push({ text: segs[i], type: tok.type === "add" ? "add" : "equal" });
                rightText += segs[i];
                if (tok.type === "add") sawAdd = true;
            }
        }
    }
    flush();
    return rows;
}

export function collapseUnchanged(rows: DiffRow[], context = 2): DiffRow[] {
    const out: DiffRow[] = [];
    let i = 0;
    while (i < rows.length) {
        if (rows[i].type !== "equal") {
            out.push(rows[i]);
            i++;
            continue;
        }
        let j = i;
        while (j < rows.length && rows[j].type === "equal") j++;
        const run = j - i;
        if (run <= context * 2 + 1) {
            for (let k = i; k < j; k++) out.push(rows[k]);
        } else {
            for (let k = 0; k < context; k++) out.push(rows[i + k]);
            out.push({
                type: "collapse",
                leftNum: null,
                rightNum: null,
                left: "",
                right: "",
                hiddenCount: run - context * 2,
            });
            for (let k = context; k > 0; k--) out.push(rows[j - k]);
        }
        i = j;
    }
    return out;
}

export function computeDiffStats(rows: DiffRow[]): DiffStats {
    const stats: DiffStats = { added: 0, removed: 0, changed: 0, unchanged: 0 };
    for (const row of rows) {
        if (row.type === "add") stats.added++;
        else if (row.type === "del") stats.removed++;
        else if (row.type === "change") stats.changed++;
        else if (row.type === "equal") stats.unchanged++;
    }
    return stats;
}

export function computeTextDiff(
    oldText: string,
    newText: string,
    options: DiffOptions = {},
): DiffResult {
    const opts: DiffOptions = {
        granularity: options.granularity || "lines",
        ignoreWhitespace: !!options.ignoreWhitespace,
        ignoreCase: !!options.ignoreCase,
    };

    const rows =
        opts.granularity === "lines"
            ? computeLineRows(oldText, newText, opts)
            : computeInlineRows(oldText, newText, opts.granularity!, opts);

    return {
        rows,
        stats: computeDiffStats(rows),
        patch: createTwoFilesPatch("original", "modified", oldText, newText, "", "", {
            context: 3,
        }),
    };
}

export function tryPrettyJson(text: string): string | null {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return null;
    }
}
