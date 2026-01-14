
/**
 * extracted from src/app/tools/regex/page.jsx
 * Parses AI response to extract valid regex pattern and flags
 */
export function parseAiResponse(response) {
    // Extract all potential regex matches from AI response
    // Matches /pattern/flags format
    const regexMatches = Array.from(response.matchAll(/\/((\\.|[^\\/])*)\/([gimsuvy]*)?/g));

    let bestMatch = null;

    if (regexMatches.length > 0) {
        // Sort to find the most likely intended regex
        const sortedMatches = regexMatches.sort((a, b) => {
            const getRegexScore = (m) => {
                const patt = m[1];
                let score = 0;
                if (patt.includes('^')) score += 5;
                if (patt.includes('$')) score += 5;
                if (patt.includes('\\')) score += 3;
                if (patt.includes('[') || patt.includes(']')) score += 3;
                if (patt.includes('(') || patt.includes(')')) score += 3;
                if (patt.includes('*') || patt.includes('+') || patt.includes('?')) score += 2;
                if (m[3]) score += 4; // Has flags
                return score;
            };

            const aInBlock = response.substring(0, a.index).includes('```');
            const bInBlock = response.substring(0, b.index).includes('```');
            if (aInBlock !== bInBlock) return bInBlock ? 1 : -1;

            const scoreA = getRegexScore(a);
            const scoreB = getRegexScore(b);
            if (Math.abs(scoreA - scoreB) >= 3) return scoreB - scoreA;
            return b[1].length - a[1].length;
        });
        bestMatch = sortedMatches[0];
    }

    let newPattern = '';
    let newFlags = '';

    if (bestMatch) {
        newPattern = bestMatch[1];
        if (bestMatch[3]) newFlags = bestMatch[3];
    } else {
        newPattern = response.trim()
            .replace(/^`+|`+$/g, '')
            .replace(/\|\^$/g, '');
    }

    // Safety cleanup
    newPattern = newPattern.replace(/\|\^$/g, '');

    // Validation
    let valid = true;
    try {
        new RegExp(newPattern, newFlags);
    } catch (e) {
        valid = false;
    }

    return { pattern: newPattern, flags: newFlags, valid };
}

/**
 * Simple heuristic to explain regex tokens
 * Returns an array of objects: { token, label, description }
 */
export function explainRegex(pattern) {
    if (!pattern) return [];

    const explanation = [];
    let i = 0;

    while (i < pattern.length) {
        const char = pattern[i];

        if (char === '\\') {
            if (i + 1 < pattern.length) {
                const next = pattern[i + 1];
                let label = `\\${next}`;
                let desc = "Escaped character";

                switch (next) {
                    case 'd': desc = "Digit (0-9)"; break;
                    case 'w': desc = "Word character (a-z, A-Z, 0-9, _)"; break;
                    case 's': desc = "Whitespace (space, tab, newline)"; break;
                    case 'b': desc = "Word boundary"; break;
                    case '.': desc = "Literal dot"; break;
                    default: desc = `Literal ${next}`; break;
                }

                explanation.push({ token: `\\${next}`, label: "Escaped", description: desc });
                i += 2;
                continue;
            }
        }

        if (char === '^') {
            explanation.push({ token: '^', label: "Anchor", description: "Start of string/line" });
        } else if (char === '$') {
            explanation.push({ token: '$', label: "Anchor", description: "End of string/line" });
        } else if (char === '.') {
            explanation.push({ token: '.', label: "Wildcard", description: "Any character (except newline)" });
        } else if (char === '*' || char === '+' || char === '?') {
            let label = "Quantifier";
            let desc = "";
            if (char === '*') desc = "Zero or more times";
            if (char === '+') desc = "One or more times";
            if (char === '?') desc = "Zero or one time (optional)";
            explanation.push({ token: char, label, description: desc });
        } else if (char === '|') {
            explanation.push({ token: '|', label: "Logic", description: "OR (Alternation)" });
        } else if (char === '(' || char === ')') {
            explanation.push({ token: char, label: "Group", description: char === '(' ? "Start capture group" : "End capture group" });
        } else if (char === '[' || char === ']') {
            explanation.push({ token: char, label: "Set", description: char === '[' ? "Start character set" : "End character set" });
        } else {
            // Group literals together for cleaner output
            let literal = char;
            let j = i + 1;
            while (j < pattern.length && !['\\', '^', '$', '.', '*', '+', '?', '|', '(', ')', '[', ']'].includes(pattern[j])) {
                literal += pattern[j];
                j++;
            }
            explanation.push({ token: literal, label: "Literal", description: `Matches "${literal}" exactly` });
            i = j - 1; // Adjust index
        }

        i++;
    }

    return explanation;
}

export const CHEATSHEET = [
    { code: '.', desc: 'Any character' },
    { code: '\\d', desc: 'Digit (0-9)' },
    { code: '\\w', desc: 'Word char' },
    { code: '\\s', desc: 'Whitespace' },
    { code: '^', desc: 'Start of line' },
    { code: '$', desc: 'End of line' },
    { code: '*', desc: '0 or more' },
    { code: '+', desc: '1 or more' },
    { code: '?', desc: '0 or 1' },
    { code: '[abc]', desc: 'Any of a, b, c' },
    { code: '(...)', desc: 'Capture group' },
];
