
import { parseAiResponse } from '../utils/regex';

const testCases = [
    {
        name: 'Standard Email',
        input: '/^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$/gm',
        expected: { pattern: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$', flags: 'gm', valid: true }
    },
    {
        name: 'URL with Escaped Slashes (The Bug Fix)',
        input: '/https?:\\/\\/[\\w\\.-]+/g',
        expected: { pattern: 'https?:\\/\\/[\\w\\.-]+', flags: 'g', valid: true }
    },
    {
        name: 'Escaped Backslash',
        input: '/\\\\/g', // Matches a literal backslash
        expected: { pattern: '\\\\', flags: 'g', valid: true }
    },
    {
        name: 'Slash in Character Class (Escaped)',
        input: '/[\\/]/', // Matches a slash
        expected: { pattern: '[\\/]', flags: '', valid: true }
    },
    {
        name: 'Complex Escaping',
        input: '/\\/\\/ comment/m', // Matches // comment
        expected: { pattern: '\\/\\/ comment', flags: 'm', valid: true }
    },
    {
        name: 'Empty Flags',
        input: '/abc/',
        expected: { pattern: 'abc', flags: '', valid: true }
    },
    {
        name: 'Wrapped in Text',
        input: 'Here is the regex: /\\d+/g hope it helps',
        expected: { pattern: '\\d+', flags: 'g', valid: true }
    },
    {
        name: 'Markdown Block',
        input: '```javascript\n/abc/i\n```',
        expected: { pattern: 'abc', flags: 'i', valid: true }
    },
    {
        name: 'Invalid Regex (Unbalanced)',
        input: '/[a-z/g', // Missing closing bracket
        expected: { valid: false }
    }
];

describe('Regex Parsing Logic', () => {
    testCases.forEach(testCase => {
        const { name, input, expected } = testCase;

        it(name, () => {
            const result = parseAiResponse(input);

            if (expected.valid === false) {
                expect(result.valid).toBe(false);
            } else {
                expect(result.valid).toBe(true);
                expect(result.pattern).toBe(expected.pattern);
                expect(result.flags || '').toBe(expected.flags || '');
            }
        });
    });
});
