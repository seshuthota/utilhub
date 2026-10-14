import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
    toggleWrap, toggleLinePrefix, insertLink, insertBlock, insertCodeBlock, TABLE_TEMPLATE,
} from '@/app/tools/markdown/editorCommands';

// jsdom has no layout; CodeMirror measures ranges when scrolling the cursor into view
beforeAll(() => {
    const rect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
    Range.prototype.getClientRects ??= () => [];
    Range.prototype.getBoundingClientRect ??= () => rect;
});

let view;
function editor(doc, anchor, head = anchor) {
    view = new EditorView({
        state: EditorState.create({ doc, selection: EditorSelection.single(anchor, head) }),
        parent: document.body,
    });
    return view;
}
const text = () => view.state.doc.toString();
const selected = () => view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);

afterEach(() => view?.destroy());

describe('markdown editor commands', () => {
    it('wraps the selection and toggles it back off', () => {
        editor('make this bold', 5, 9);
        toggleWrap(view, '**');
        expect(text()).toBe('make **this** bold');
        expect(selected()).toBe('this');
        toggleWrap(view, '**');
        expect(text()).toBe('make this bold');
        expect(selected()).toBe('this');
    });

    it('inserts a selected placeholder when nothing is selected', () => {
        editor('x ', 2);
        toggleWrap(view, '_', 'italic text');
        expect(text()).toBe('x _italic text_');
        expect(selected()).toBe('italic text');
    });

    it('toggles line prefixes across a multi-line selection', () => {
        editor('one\ntwo\nthree', 0, 9);
        toggleLinePrefix(view, '- ');
        expect(text()).toBe('- one\n- two\n- three');
        toggleLinePrefix(view, '- ');
        expect(text()).toBe('one\ntwo\nthree');
    });

    it('numbers ordered lists and replaces existing heading levels', () => {
        editor('a\nb', 0, 3);
        toggleLinePrefix(view, '1. ');
        expect(text()).toBe('1. a\n2. b');
        editor('# Title', 0);
        toggleLinePrefix(view, '## ');
        expect(text()).toBe('## Title');
    });

    it('builds links with the URL selected for typing', () => {
        editor('see docs', 4, 8);
        insertLink(view);
        expect(text()).toBe('see [docs](https://)');
        expect(selected()).toBe('https://');
    });

    it('inserts blocks on their own lines', () => {
        editor('intro', 5);
        insertBlock(view, TABLE_TEMPLATE, 'Column');
        expect(text()).toBe(`intro\n\n${TABLE_TEMPLATE}\n`);
        expect(selected()).toBe('Column');
    });

    it('fences a selection as a code block', () => {
        editor('let x = 1', 0, 9);
        insertCodeBlock(view);
        expect(text()).toBe('```\nlet x = 1\n```');
    });
});
