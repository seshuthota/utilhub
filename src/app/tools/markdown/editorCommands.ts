/**
 * Markdown formatting commands for the CodeMirror editor (toolbar + shortcuts).
 * Each returns true when it handled the action, matching CodeMirror's Command shape.
 */
import { EditorSelection } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";

/** Toggle an inline marker (`**`, `_`, `` ` ``, `~~`) around each selection. */
export function toggleWrap(view: EditorView, marker: string, placeholder = "text"): boolean {
    const { state } = view;
    const tr = state.changeByRange((range) => {
        const before = state.sliceDoc(range.from - marker.length, range.from);
        const after = state.sliceDoc(range.to, range.to + marker.length);
        // Already wrapped → unwrap
        if (before === marker && after === marker) {
            return {
                changes: [
                    { from: range.from - marker.length, to: range.from },
                    { from: range.to, to: range.to + marker.length },
                ],
                range: EditorSelection.range(range.from - marker.length, range.to - marker.length),
            };
        }
        const text = range.empty ? placeholder : state.sliceDoc(range.from, range.to);
        return {
            changes: { from: range.from, to: range.to, insert: `${marker}${text}${marker}` },
            range: EditorSelection.range(range.from + marker.length, range.from + marker.length + text.length),
        };
    });
    view.dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input.format" }));
    view.focus();
    return true;
}

/**
 * Toggle a line prefix (`# `, `> `, `- `, `1. `, `- [ ] `) on every selected line.
 * Removes it when all selected lines already have it.
 */
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
    const { state } = view;
    const lines = new Map<number, { from: number; text: string }>();
    for (const range of state.selection.ranges) {
        for (let pos = range.from; pos <= range.to; ) {
            const line = state.doc.lineAt(pos);
            lines.set(line.number, { from: line.from, text: line.text });
            pos = line.to + 1;
        }
    }
    const numbered = prefix === "1. ";
    const pattern = numbered ? /^\d+\.\s/ : null;
    const has = (text: string) => (pattern ? pattern.test(text) : text.startsWith(prefix));
    const all = [...lines.values()].every((l) => has(l.text));

    let n = 0;
    const changes = [...lines.values()].map(({ from, text }) => {
        if (all) {
            const len = pattern ? text.match(pattern)![0].length : prefix.length;
            return { from, to: from + len };
        }
        n += 1;
        // Headings replace an existing heading marker instead of stacking
        const existingHeading = prefix.startsWith("#") ? text.match(/^#{1,6}\s/)?.[0].length ?? 0 : 0;
        return { from, to: from + existingHeading, insert: numbered ? `${n}. ` : prefix };
    });
    view.dispatch({ changes, scrollIntoView: true, userEvent: "input.format" });
    view.focus();
    return true;
}

/** `[text](url)` around the selection, with `url` selected for typing. */
export function insertLink(view: EditorView): boolean {
    const { state } = view;
    const tr = state.changeByRange((range) => {
        const text = range.empty ? "link text" : state.sliceDoc(range.from, range.to);
        const insert = `[${text}](https://)`;
        const urlStart = range.from + text.length + 3;
        return {
            changes: { from: range.from, to: range.to, insert },
            range: EditorSelection.range(urlStart, urlStart + "https://".length),
        };
    });
    view.dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input.format" }));
    view.focus();
    return true;
}

/** Insert a block on its own lines at the cursor, selecting `select` within it if given. */
export function insertBlock(view: EditorView, block: string, select?: string): boolean {
    const { state } = view;
    const range = state.selection.main;
    const line = state.doc.lineAt(range.from);
    const needsLeadingBreak = line.text.trim().length > 0;
    const prefix = needsLeadingBreak ? "\n\n" : "";
    const insertAt = needsLeadingBreak ? line.to : line.from;
    const text = `${prefix}${block}\n`;
    const offset = select ? text.indexOf(select) : -1;
    view.dispatch({
        changes: { from: insertAt, to: needsLeadingBreak ? insertAt : line.to, insert: text },
        selection:
            offset >= 0
                ? EditorSelection.range(insertAt + offset, insertAt + offset + select!.length)
                : EditorSelection.cursor(insertAt + text.length),
        scrollIntoView: true,
        userEvent: "input.format",
    });
    view.focus();
    return true;
}

/** Wrap the selection in a fenced code block (or insert an empty one). */
export function insertCodeBlock(view: EditorView): boolean {
    const { state } = view;
    const range = state.selection.main;
    if (range.empty) return insertBlock(view, "```js\ncode\n```", "code");
    const text = state.sliceDoc(range.from, range.to);
    view.dispatch({
        changes: { from: range.from, to: range.to, insert: `\`\`\`\n${text}\n\`\`\`` },
        selection: EditorSelection.cursor(range.from + 3),
        userEvent: "input.format",
    });
    view.focus();
    return true;
}

export const TABLE_TEMPLATE = "| Column | Column |\n| ------ | ------ |\n| Cell   | Cell   |";

export const markdownKeymap = keymap.of([
    { key: "Mod-b", run: (v) => toggleWrap(v, "**", "bold text") },
    { key: "Mod-i", run: (v) => toggleWrap(v, "_", "italic text") },
    { key: "Mod-k", run: insertLink },
    { key: "Mod-e", run: (v) => toggleWrap(v, "`", "code") },
]);
