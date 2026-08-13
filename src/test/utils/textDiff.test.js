import { describe, it, expect } from 'vitest';
import { computeTextDiff, collapseUnchanged, tryPrettyJson } from '@/utils/textDiff';

describe('computeTextDiff', () => {
    it('detects added and removed lines', () => {
        const { stats, rows } = computeTextDiff('aaa\nbbb', 'aaa\nccc');
        expect(stats.unchanged).toBe(1);
        expect(rows.some((r) => r.type === 'change' || r.type === 'del')).toBe(true);
        expect(rows.some((r) => r.type === 'change' || r.type === 'add')).toBe(true);
    });

    it('reports no changes for identical text', () => {
        const { stats } = computeTextDiff('hello\nworld', 'hello\nworld');
        expect(stats.added).toBe(0);
        expect(stats.removed).toBe(0);
        expect(stats.changed).toBe(0);
        expect(stats.unchanged).toBe(2);
    });

    it('ignores case when asked', () => {
        const { stats } = computeTextDiff('Hello', 'hello', { ignoreCase: true });
        expect(stats.unchanged).toBe(1);
        expect(stats.changed + stats.added + stats.removed).toBe(0);
    });

    it('ignores trailing whitespace when asked', () => {
        const { stats } = computeTextDiff('foo  ', 'foo', { ignoreWhitespace: true });
        expect(stats.unchanged).toBe(1);
    });

    it('produces a unified patch', () => {
        const { patch } = computeTextDiff('a\n', 'b\n');
        expect(patch).toContain('--- original');
        expect(patch).toContain('+++ modified');
        expect(patch).toMatch(/[-+]a|[-+]b/);
    });

    it('word granularity highlights intra-line edits', () => {
        const { rows } = computeTextDiff('hello world', 'hello there', { granularity: 'words' });
        const changed = rows.find((r) => r.type === 'change' || r.type === 'add' || r.type === 'del');
        expect(changed).toBeTruthy();
    });
});

describe('collapseUnchanged', () => {
    it('collapses long equal runs', () => {
        const equal = Array.from({ length: 10 }, (_, i) => ({
            type: 'equal',
            leftNum: i + 1,
            rightNum: i + 1,
            left: `L${i}`,
            right: `L${i}`,
        }));
        const out = collapseUnchanged(equal, 2);
        expect(out.some((r) => r.type === 'collapse')).toBe(true);
        expect(out.find((r) => r.type === 'collapse').hiddenCount).toBe(6);
    });
});

describe('tryPrettyJson', () => {
    it('pretty prints objects', () => {
        expect(tryPrettyJson('{"a":1}')).toContain('\n');
    });
    it('returns null for invalid JSON', () => {
        expect(tryPrettyJson('not json')).toBeNull();
    });
});
