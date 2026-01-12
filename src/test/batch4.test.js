import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import Papa from 'papaparse';

describe('Batch 4 Logic Tests', () => {

    describe('YAML Converter', () => {
        it('should convert JSON to YAML', () => {
            const obj = { name: 'test' };
            const res = yaml.dump(obj);
            expect(res).toContain('name: test');
        });

        it('should convert YAML to JSON', () => {
            const yml = 'name: test';
            const res = yaml.load(yml);
            expect(res.name).toBe('test');
        });
    });

    describe('CSV Parser', () => {
        it('should parse CSV string', () => {
            const csv = 'name,age\nAlice,30';
            const res = Papa.parse(csv, { header: true });
            expect(res.data[0].name).toBe('Alice');
            expect(res.data[0].age).toBe('30');
        });
    });

    describe('URL Encoder', () => {
        it('should encode URL', () => {
            const input = 'hello world';
            expect(encodeURIComponent(input)).toBe('hello%20world');
        });

        it('should decode URL', () => {
            const input = 'hello%20world';
            expect(decodeURIComponent(input)).toBe('hello world');
        });
    });

    describe('Regex Logic', () => {
        it('should match pattern', () => {
            const pattern = '\\d+';
            const text = 'abc 123';
            const regex = new RegExp(pattern);
            const match = text.match(regex);
            expect(match[0]).toBe('123');
        });
    });

});
