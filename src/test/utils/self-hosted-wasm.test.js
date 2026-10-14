import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(__dirname, '../../..');
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

// Wasm is served from public/ so tools work offline and never hit a third-party CDN.
// If a package is upgraded, these copies must be refreshed or the tool breaks.
describe('self-hosted wasm', () => {
    it('public/sqljs/sql-wasm.wasm matches the installed sql.js', () => {
        expect(sha(path.join(root, 'public/sqljs/sql-wasm.wasm')))
            .toBe(sha(path.join(root, 'node_modules/sql.js/dist/sql-wasm.wasm')));
    });

    it('every dprint plugin the formatter references exists in public/', () => {
        const source = readFileSync(path.join(root, 'src/utils/dprintFormatter.ts'), 'utf8');
        const files = [...source.matchAll(/\/dprint\/([\w.-]+\.wasm)/g)].map((m) => m[1]);
        expect(files.length).toBeGreaterThan(0);
        files.forEach((f) => expect(existsSync(path.join(root, 'public/dprint', f)), f).toBe(true));
        expect(source).not.toMatch(/https?:\/\/plugins\.dprint\.dev/);
    });

    it('sqlite tool loads sql.js from the app, not a CDN', () => {
        const page = readFileSync(path.join(root, 'src/app/tools/sqlite/page.tsx'), 'utf8');
        expect(page).not.toMatch(/sql\.js\.org/);
    });
});
