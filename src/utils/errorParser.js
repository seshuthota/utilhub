/**
 * Utility to parse and enhance common syntax error messages
 */

export function parseJsonError(error, jsonString) {
    if (!error) return null;
    const message = error.message || String(error);

    // V8 (Chrome/Edge/Node) format: "Unexpected token p in JSON at position 12"
    let match = message.match(/at position (\d+)/);
    if (match) {
        const position = parseInt(match[1]);
        const { line, col } = getLineCol(jsonString, position);
        return {
            message: `Syntax Error: ${message.split(' at position')[0]}`,
            line,
            col,
            suggestion: getJsonSuggestion(message, jsonString, position)
        };
    }

    // Firefox format: "JSON.parse: unexpected character at line 1 column 13 of the JSON data"
    match = message.match(/at line (\d+) column (\d+)/);
    if (match) {
        return {
            message: `Syntax Error: ${message.split(' at line')[0]}`,
            line: parseInt(match[1]),
            col: parseInt(match[2]),
            suggestion: getJsonSuggestion(message, jsonString)
        };
    }

    return { message, line: null, col: null };
}

function getLineCol(str, pos) {
    const lines = str.substring(0, pos).split('\n');
    return {
        line: lines.length,
        col: lines[lines.length - 1].length + 1
    };
}

function getJsonSuggestion(message, str, pos) {
    const lowMsg = message.toLowerCase();

    if (lowMsg.includes('unexpected token')) {
        if (lowMsg.includes("'")) return "Use double quotes (\") instead of single quotes (').";
        if (lowMsg.includes("expected ','")) return "Missing comma between items?";
    }

    if (str && pos !== undefined) {
        const char = str[pos];
        if (char === "'") return "JSON requires double quotes (\") for strings and keys.";
    }

    return "Check for missing commas, unquoted keys, or mismatched brackets.";
}
