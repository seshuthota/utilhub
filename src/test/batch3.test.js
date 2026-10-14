import { describe, it, expect } from 'vitest';
import { md5, sha256 } from 'hash-wasm';
import { toolAdapters } from '@/utils/pipeline/adapters';
import { loremIpsum } from 'lorem-ipsum';
import zxcvbn from 'zxcvbn';
import { getUnixTime, fromUnixTime } from 'date-fns';

describe('Batch 3 Logic Tests', () => {

    describe('Hash Generator', () => {
        // The Hash tool page uses hash-wasm; the pipeline adapter uses Web Crypto.
        it('should generate correct MD5 hash (hash-wasm, as used by the Hash tool)', async () => {
            expect(await md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
        });

        it('should generate correct SHA-256 hash (hash-wasm, as used by the Hash tool)', async () => {
            // echo -n "hello" | shasum -a 256
            expect(await sha256('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
        });

        it('should generate correct SHA-256 hash via the pipeline adapter', async () => {
            const result = await toolAdapters.hash.transform('hello', { mode: 'sha256' });
            expect(result.error).toBeUndefined();
            expect(result.output).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
        });

        it('should reject unsupported algorithms in the pipeline adapter', async () => {
            const result = await toolAdapters.hash.transform('hello', { mode: 'md5' });
            expect(result.output).toBeNull();
            expect(result.error).toMatch(/not supported/);
        });
    });

    describe('Password Strength', () => {
        it('should calculate score using zxcvbn', () => {
            const weak = zxcvbn('password');
            const strong = zxcvbn('CorrectHorseBatteryStaple');

            expect(weak.score).toBeLessThan(2);
            expect(strong.score).toBeGreaterThan(2);
        });
    });

    describe('Lorem Ipsum', () => {
        it('should generate requested units', () => {
            const text = loremIpsum({ count: 1, units: 'sentences' });
            expect(typeof text).toBe('string');
            expect(text.length).toBeGreaterThan(0);
            expect(text.endsWith('.')).toBe(true);
        });
    });

    describe('Timestamp Logic', () => {
        it('should convert date to unix', () => {
            const date = new Date('2023-01-01T00:00:00Z');
            const unix = getUnixTime(date);
            expect(unix).toBe(1672531200);
        });

        it('should convert unix to date', () => {
            const unix = 1672531200;
            const date = fromUnixTime(unix);
            expect(date.toISOString()).toBe('2023-01-01T00:00:00.000Z');
        });
    });

});
