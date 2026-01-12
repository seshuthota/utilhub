import { describe, it, expect } from 'vitest';
import { Base64 } from 'js-base64';
import { format } from 'sql-formatter';
import xmlFormat from 'xml-formatter';

describe('Utility Logic Tests', () => {

    describe('Base64', () => {
        it('should encode text to base64', () => {
            const input = 'Hello World';
            const expected = 'SGVsbG8gV29ybGQ=';
            expect(Base64.encode(input)).toBe(expected);
        });

        it('should decode base64 to text', () => {
            const input = 'SGVsbG8gV29ybGQ=';
            const expected = 'Hello World';
            expect(Base64.decode(input)).toBe(expected);
        });
    });

    describe('SQL Formatter', () => {
        it('should format simple SQL selection', () => {
            const input = 'SELECT * FROM users WHERE id = 1';
            // We expect some formatted indentation
            const result = format(input, { language: 'sql', tabWidth: 2, keywordCase: 'upper' });
            expect(result).toContain('SELECT');
            expect(result).toContain('FROM');
            expect(result).toContain('WHERE');
            // Basic check that it added newlines/formatting is hard to assert exactly without brittle tests,
            // but we can check it changed the single line input.
            expect(result).not.toBe(input);
        });
    });

    describe('XML Formatter', () => {
        it('should format XML', () => {
            const input = '<root><child>text</child></root>';
            const result = xmlFormat(input, { indentation: '  ', lineSeparator: '\n' });
            expect(result).toContain('<root>');
            expect(result).toContain('  <child>'); // indentation
            expect(result).toContain('</root>');
        });
    });

});
