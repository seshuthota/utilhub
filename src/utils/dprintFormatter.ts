/**
 * dprint Wasm Formatter Utility
 * Lazy-loads dprint Wasm plugins from CDN for fast code formatting
 */

import { createFromBuffer, type Formatter } from "@dprint/formatter";

// Plugin URLs from dprint CDN
const PLUGIN_URLS: Record<string, string> = {
    typescript: "https://plugins.dprint.dev/typescript-0.93.3.wasm",
    javascript: "https://plugins.dprint.dev/typescript-0.93.3.wasm",
    json: "https://plugins.dprint.dev/json-0.19.4.wasm",
    markdown: "https://plugins.dprint.dev/markdown-0.17.8.wasm",
};

// File extensions for each language
const FILE_EXTENSIONS: Record<string, string> = {
    typescript: "file.ts",
    javascript: "file.js",
    json: "file.json",
    markdown: "file.md",
};

// Cached formatters
const formatters: Record<string, Formatter> = {};
const loadingPromises: Record<string, Promise<Formatter>> = {};

/**
 * Check if dprint supports the given language
 */
export function isDprintSupported(language: string): boolean {
    return language in PLUGIN_URLS;
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): string[] {
    return Object.keys(PLUGIN_URLS);
}

/**
 * Load a dprint formatter for the given language
 */
async function loadFormatter(language: string): Promise<Formatter> {
    const url = PLUGIN_URLS[language];
    if (!url) {
        throw new Error(`No dprint plugin available for: ${language}`);
    }

    // Return cached formatter if available
    if (formatters[language]) {
        return formatters[language];
    }

    // Return existing loading promise if in progress
    if (language in loadingPromises) {
        return loadingPromises[language];
    }

    // Start loading
    loadingPromises[language] = (async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch dprint plugin: ${response.statusText}`);
            }
            const wasmBuffer = await response.arrayBuffer();
            const formatter = createFromBuffer(new Uint8Array(wasmBuffer));

            // Set default configuration
            formatter.setConfig({}, {
                lineWidth: 80,
                indentWidth: 2,
                useTabs: false,
            });

            formatters[language] = formatter;
            return formatter;
        } finally {
            delete loadingPromises[language];
        }
    })();

    return loadingPromises[language];
}

/**
 * Format code using dprint Wasm
 * @param code - The code to format
 * @param language - The language (typescript, javascript, json, markdown)
 * @returns Formatted code
 */
export async function formatWithDprint(code: string, language: string): Promise<string> {
    const formatter = await loadFormatter(language);
    const fileName = FILE_EXTENSIONS[language] || "file.txt";

    const result = formatter.formatText({
        filePath: fileName,
        fileText: code
    });

    return result;
}

/**
 * Preload a formatter for faster first use
 */
export async function preloadFormatter(language: string): Promise<void> {
    if (isDprintSupported(language)) {
        await loadFormatter(language);
    }
}
