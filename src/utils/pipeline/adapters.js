// Tool Adapters - Define I/O formats and transformation functions for each tool

import { IO_TYPES } from "./types";
import { tools } from "@/config/tools";

// Tool capability registry
export const toolAdapters = {
  json: {
    id: "json",
    name: "JSON Formatter",
    inputTypes: [IO_TYPES.TEXT, IO_TYPES.JSON, IO_TYPES.UNKNOWN],
    outputType: IO_TYPES.JSON,
    modes: ["format", "minify", "validate"],
    defaultMode: "format",
    transform: (input, options = {}) => {
      try {
        const parsed = JSON.parse(input);
        if (options.mode === "minify") {
          return { output: JSON.stringify(parsed), outputType: IO_TYPES.JSON };
        }
        const formatted = JSON.stringify(parsed, null, 2);
        return { output: formatted, outputType: IO_TYPES.JSON };
      } catch (e) {
        return { output: null, error: e.message, outputType: IO_TYPES.JSON };
      }
    },
  },

  base64: {
    id: "base64",
    name: "Base64 Converter",
    inputTypes: [IO_TYPES.TEXT, IO_TYPES.BASE64],
    outputType: IO_TYPES.BASE64,
    modes: ["encode", "decode"],
    defaultMode: "encode",
    transform: (input, options = {}) => {
      try {
        const mode = options.mode || "encode";
        let output;
        if (mode === "decode") {
          output = atob(input);
        } else {
          output = btoa(input);
        }
        return { output, outputType: IO_TYPES.BASE64 };
      } catch (e) {
        return {
          output: null,
          error: "Invalid Base64 input",
          outputType: IO_TYPES.BASE64,
        };
      }
    },
  },

  hash: {
    id: "hash",
    name: "Hash Generator",
    inputTypes: [IO_TYPES.TEXT],
    outputType: IO_TYPES.HASH,
    modes: ["md5", "sha1", "sha256", "sha512"],
    defaultMode: "sha256",
    transform: (input, options = {}) => {
      const algorithm = options.algorithm || "sha256";
      const msgBuffer = new TextEncoder().encode(input);
      const hashBuffer = crypto.subtle.digest(algorithm, msgBuffer);
      return hashBuffer
        .then((hashArray) => {
          const hashArrayBuffer = new Uint8Array(hashArray);
          const hashHex = Array.from(hashArrayBuffer)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          return { output: hashHex, outputType: IO_TYPES.HASH };
        })
        .catch(() => ({
          output: null,
          error: "Hash computation failed",
          outputType: IO_TYPES.HASH,
        }));
    },
  },

  url: {
    id: "url",
    name: "URL Encoder",
    inputTypes: [IO_TYPES.TEXT, IO_TYPES.URL_ENCODED],
    outputType: IO_TYPES.URL_ENCODED,
    modes: ["encode", "decode"],
    defaultMode: "encode",
    transform: (input, options = {}) => {
      const mode = options.mode || "encode";
      try {
        let output;
        if (mode === "decode") {
          output = decodeURIComponent(input);
        } else {
          output = encodeURIComponent(input);
        }
        return { output, outputType: IO_TYPES.URL_ENCODED };
      } catch (e) {
        return {
          output: null,
          error: "Invalid URL encoding",
          outputType: IO_TYPES.URL_ENCODED,
        };
      }
    },
  },

  yaml: {
    id: "yaml",
    name: "YAML Converter",
    inputTypes: [IO_TYPES.TEXT, IO_TYPES.YAML, IO_TYPES.JSON],
    outputType: IO_TYPES.YAML,
    modes: ["convert-to-yaml", "convert-to-json"],
    defaultMode: "convert-to-yaml",
    transform: async (input, options = {}) => {
      const jsyaml = await import("js-yaml");
      try {
        const parsed = jsyaml.load(input);
        if (options.mode === "convert-to-json") {
          return {
            output: JSON.stringify(parsed, null, 2),
            outputType: IO_TYPES.JSON,
          };
        }
        const output = jsyaml.dump(parsed);
        return { output, outputType: IO_TYPES.YAML };
      } catch (e) {
        return { output: null, error: e.message, outputType: IO_TYPES.YAML };
      }
    },
  },

  xml: {
    id: "xml",
    name: "XML Formatter",
    inputTypes: [IO_TYPES.TEXT, IO_TYPES.XML],
    outputType: IO_TYPES.XML,
    modes: ["format", "minify"],
    defaultMode: "format",
    transform: async (input, options = {}) => {
      const xmlFormatter = await import("xml-formatter");
      try {
        const formatted = xmlFormatter.default(input, {
          indentation: options.mode === "minify" ? "" : "  ",
          lineSeparator: "\n",
        });
        return { output: formatted, outputType: IO_TYPES.XML };
      } catch (e) {
        return { output: null, error: e.message, outputType: IO_TYPES.XML };
      }
    },
  },

  beautify: {
    id: "beautify",
    name: "Code Beautifier",
    inputTypes: [
      IO_TYPES.TEXT,
      IO_TYPES.JAVASCRIPT,
      IO_TYPES.HTML,
      IO_TYPES.CSS,
      IO_TYPES.JSON,
    ],
    outputType: IO_TYPES.TEXT,
    modes: ["beautify", "minify"],
    defaultMode: "beautify",
    transform: async (input, options = {}) => {
      const prettier = await import("prettier/standalone");
      const parserBabel = await import("prettier/plugins/babel");
      const parserHtml = await import("prettier/plugins/html");
      const parserPostcss = await import("prettier/plugins/postcss");
      const parserEstree = await import("prettier/plugins/estree");

      const language = options.language || "javascript";
      const parserMap = {
        javascript: "babel",
        typescript: "babel-ts",
        html: "html",
        css: "css",
        json: "json",
      };

      const pluginMap = {
        javascript: [parserBabel.default, parserEstree.default],
        typescript: [parserBabel.default, parserEstree.default],
        html: [parserHtml.default],
        css: [parserPostcss.default],
        json: [parserBabel.default, parserEstree.default],
      };

      try {
        const formatted = await prettier.format(input, {
          parser: parserMap[language] || "babel",
          plugins: pluginMap[language] || [],
          printWidth: 80,
          tabWidth: 2,
          semi: true,
          singleQuote: true,
        });
        return { output: formatted, outputType: IO_TYPES.TEXT };
      } catch (e) {
        return { output: null, error: e.message, outputType: IO_TYPES.TEXT };
      }
    },
  },

  jwt: {
    id: "jwt",
    name: "JWT Decoder",
    inputTypes: [IO_TYPES.TEXT, IO_TYPES.JWT],
    outputType: IO_TYPES.JSON,
    modes: ["decode-header", "decode-payload", "decode-all"],
    defaultMode: "decode-all",
    transform: (input, options = {}) => {
      try {
        const parts = input.split(".");
        if (parts.length !== 3) {
          return {
            output: null,
            error: "Invalid JWT format",
            outputType: IO_TYPES.JSON,
          };
        }

        const decode = (token) => {
          try {
            return JSON.parse(
              atob(token.replace(/-/g, "+").replace(/_/g, "/")),
            );
          } catch {
            return null;
          }
        };

        const mode = options.mode || "decode-all";
        const result = {};

        if (mode === "decode-header" || mode === "decode-all") {
          result.header = decode(parts[0]);
        }
        if (mode === "decode-payload" || mode === "decode-all") {
          result.payload = decode(parts[1]);
        }
        if (mode === "decode-all") {
          result.signature = parts[2].substring(0, 20) + "...";
        }

        return {
          output: JSON.stringify(result, null, 2),
          outputType: IO_TYPES.JSON,
        };
      } catch (e) {
        return { output: null, error: e.message, outputType: IO_TYPES.JSON };
      }
    },
  },

  csv: {
    id: "csv",
    name: "CSV Viewer",
    inputTypes: [IO_TYPES.TEXT, IO_TYPES.CSV, IO_TYPES.JSON],
    outputType: IO_TYPES.JSON,
    modes: ["csv-to-json", "json-to-csv"],
    defaultMode: "csv-to-json",
    transform: async (input, options = {}) => {
      const Papa = await import("papaparse");
      try {
        if (options.mode === "json-to-csv") {
          const parsed = JSON.parse(input);
          const csv = Papa.unparse(parsed);
          return { output: csv, outputType: IO_TYPES.CSV };
        }
        const result = Papa.parse(input, { header: true, dynamicTyping: true });
        return {
          output: JSON.stringify(result.data, null, 2),
          outputType: IO_TYPES.JSON,
        };
      } catch (e) {
        return { output: null, error: e.message, outputType: IO_TYPES.JSON };
      }
    },
  },

  text: {
    id: "text",
    name: "Text Tools",
    inputTypes: [IO_TYPES.TEXT],
    outputType: IO_TYPES.TEXT,
    modes: [
      "uppercase",
      "lowercase",
      "trim",
      "reverse",
      "base64-encode",
      "base64-decode",
    ],
    defaultMode: "trim",
    transform: (input, options = {}) => {
      const mode = options.mode || "trim";
      let output = input;

      switch (mode) {
        case "uppercase":
          output = input.toUpperCase();
          break;
        case "lowercase":
          output = input.toLowerCase();
          break;
        case "trim":
          output = input.trim();
          break;
        case "reverse":
          output = input.split("").reverse().join("");
          break;
        case "base64-encode":
          output = btoa(input);
          break;
        case "base64-decode":
          output = atob(input);
          break;
      }

      return { output, outputType: IO_TYPES.TEXT };
    },
  },
};

// Get adapter for a tool
export function getToolAdapter(toolId) {
  return toolAdapters[toolId] || null;
}

// Check if a tool can be used in pipeline
export function isPipelineCompatible(toolId) {
  return toolAdapters[toolId] !== undefined;
}

// Get all pipeline-compatible tools
export function getPipelineCompatibleTools() {
  return tools.filter((tool) => isPipelineCompatible(tool.id));
}

// Auto-detect input type
export function detectInputType(input) {
  const trimmed = input.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return IO_TYPES.JSON;
    } catch {}
  }

  if (trimmed.startsWith("---")) {
    return IO_TYPES.YAML;
  }

  if (trimmed.startsWith("<")) {
    return IO_TYPES.HTML;
  }

  if (/^[A-Za-z0-9+/=]+={0,2}$/.test(trimmed) && trimmed.length % 4 === 0) {
    return IO_TYPES.BASE64;
  }

  if (trimmed.split(",").every((row) => row.includes(","))) {
    return IO_TYPES.CSV;
  }

  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(trimmed)) {
    return IO_TYPES.JWT;
  }

  return IO_TYPES.TEXT;
}

// Validate pipeline configuration
export function validatePipeline(pipeline) {
  const errors = [];

  if (!pipeline.name || pipeline.name.trim() === "") {
    errors.push("Pipeline must have a name");
  }

  if (!pipeline.steps || pipeline.steps.length === 0) {
    errors.push("Pipeline must have at least one step");
  }

  pipeline.steps.forEach((step, index) => {
    if (!step.toolId) {
      errors.push(`Step ${index + 1}: Tool ID is required`);
    }

    const adapter = getToolAdapter(step.toolId);
    if (!adapter) {
      errors.push(`Step ${index + 1}: Unknown tool "${step.toolId}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
