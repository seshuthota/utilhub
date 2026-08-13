// Pipeline Persistence and URL Sharing

import { createPipeline, createPipelineStep, PIPELINE_VERSION } from "./types";

const STORAGE_KEY = "utilhub_pipelines";
const MAX_STORED_PIPELINES = 50;

// Generate short ID for URL sharing
function generateShortId() {
  return (
    Math.random().toString(36).substring(2, 8) +
    Math.random().toString(36).substring(2, 8)
  );
}

// Base64 encode for URL (UTF-8 safe)
function encodeToBase64(obj) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch {
    return "";
  }
}

// Decode from URL
function decodeFromBase64(str) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    try {
      return JSON.parse(atob(str));
    } catch {
      return null;
    }
  }
}

// Save pipeline to localStorage
export function savePipeline(pipeline) {
  try {
    const stored = getStoredPipelines();

    // Check if pipeline already exists
    const existingIndex = stored.findIndex((p) => p.id === pipeline.id);

    if (existingIndex >= 0) {
      stored[existingIndex] = {
        ...pipeline,
        updatedAt: new Date().toISOString(),
      };
    } else {
      stored.push({ ...pipeline, updatedAt: new Date().toISOString() });
    }

    // Limit stored pipelines
    while (stored.length > MAX_STORED_PIPELINES) {
      stored.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch (e) {
    console.error("Failed to save pipeline:", e);
    return false;
  }
}

// Load pipeline from localStorage
export function loadPipeline(id) {
  try {
    const stored = getStoredPipelines();
    return stored.find((p) => p.id === id) || null;
  } catch (e) {
    console.error("Failed to load pipeline:", e);
    return null;
  }
}

// Get all stored pipelines
export function getStoredPipelines() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Delete pipeline from localStorage
export function deletePipeline(id) {
  try {
    const stored = getStoredPipelines();
    const filtered = stored.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error("Failed to delete pipeline:", e);
    return false;
  }
}

// Export pipeline for sharing
export function exportPipeline(pipeline) {
  const exportData = {
    version: PIPELINE_VERSION,
    exportedAt: new Date().toISOString(),
    pipeline,
  };
  return JSON.stringify(exportData, null, 2);
}

// Import pipeline from shared data
export function importPipeline(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (data.version !== PIPELINE_VERSION) {
      console.warn("Pipeline version mismatch, may need migration");
    }

    if (!data.pipeline || !data.pipeline.steps) {
      throw new Error("Invalid pipeline format");
    }

    return createPipeline(data.pipeline);
  } catch (e) {
    console.error("Failed to import pipeline:", e);
    return null;
  }
}

// Generate shareable URL
export function generateShareUrl(pipeline, baseUrl = window.location.origin) {
  const shareData = {
    v: PIPELINE_VERSION,
    id: pipeline.id,
    n: pipeline.name.substring(0, 50),
    s: pipeline.steps.map((step) => ({
      t: step.toolId,
      o: step.options || {},
    })),
  };

  const encoded = encodeToBase64(shareData);
  return `${baseUrl}/tools/pipeline?p=${encoded}`;
}

// Load pipeline from URL
export function loadFromUrl(urlParams) {
  try {
    const encoded = urlParams.get("p");
    if (!encoded) return null;

    const data = decodeFromBase64(encoded);
    if (!data) {
      throw new Error("Invalid pipeline data in URL");
    }
    if (data.v !== PIPELINE_VERSION) {
      console.warn("Pipeline URL version mismatch");
    }

    if (!data.s || !Array.isArray(data.s)) {
      throw new Error("Invalid pipeline data in URL");
    }

    // Reconstruct pipeline
    const pipeline = createPipeline({
      id: data.id || generateShortId(),
      name: data.n || "Shared Pipeline",
      steps: data.s.map((step, index) =>
        createPipelineStep(step.t, {
          options: step.o || {},
          order: index,
        }),
      ),
    });

    return pipeline;
  } catch (e) {
    console.error("Failed to load pipeline from URL:", e);
    return null;
  }
}

// Duplicate a pipeline
export function duplicatePipeline(pipeline, newName = null) {
  const newPipeline = createPipeline({
    ...pipeline,
    id: undefined,
    name: newName || `${pipeline.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Deep clone steps
  newPipeline.steps = pipeline.steps.map((step) => ({
    ...step,
    id: undefined,
  }));

  savePipeline(newPipeline);
  return newPipeline;
}

// Get recent pipelines
export function getRecentPipelines(limit = 5) {
  const stored = getStoredPipelines();
  return stored
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit);
}

// Search pipelines
export function searchPipelines(query) {
  const stored = getStoredPipelines();
  const lowerQuery = query.toLowerCase();

  return stored.filter(
    (pipeline) =>
      pipeline.name.toLowerCase().includes(lowerQuery) ||
      pipeline.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      pipeline.steps.some((step) =>
        step.toolId.toLowerCase().includes(lowerQuery),
      ),
  );
}

// Create example pipelines
export function getExamplePipelines() {
  return [
    createPipeline({
      name: "JSON Pipeline",
      description: "Format JSON, minify, then SHA-256 hash",
      steps: [
        createPipelineStep("json", { name: "Format JSON", options: { mode: "format" } }),
        createPipelineStep("json", { name: "Minify JSON", options: { mode: "minify" } }),
        createPipelineStep("hash", { name: "Generate Hash", options: { mode: "sha256" } }),
      ],
      inputType: "json",
      outputType: "hash",
      tags: ["json", "formatting", "security"],
    }),
    createPipeline({
      name: "Config Converter",
      description: "JSON → YAML → Base64",
      steps: [
        createPipelineStep("json", { name: "Format JSON", options: { mode: "format" } }),
        createPipelineStep("yaml", {
          name: "Convert to YAML",
          options: { mode: "convert-to-yaml" },
        }),
        createPipelineStep("base64", { name: "Base64 Encode", options: { mode: "encode" } }),
      ],
      inputType: "json",
      outputType: "base64",
      tags: ["config", "yaml", "encoding"],
    }),
    createPipeline({
      name: "JWT Debugger",
      description: "Decode JWT then pretty-print payload JSON",
      steps: [
        createPipelineStep("jwt", { name: "Decode JWT", options: { mode: "decode-payload" } }),
        createPipelineStep("json", { name: "Format JSON", options: { mode: "format" } }),
      ],
      inputType: "jwt",
      outputType: "json",
      tags: ["jwt", "debugging", "auth"],
    }),
    createPipeline({
      name: "Redact Emails",
      description: "Find and redact email addresses in text",
      steps: [
        createPipelineStep("regex", {
          name: "Redact emails",
          options: { mode: "redact-emails" },
        }),
      ],
      inputType: "text",
      outputType: "text",
      tags: ["regex", "privacy"],
    }),
    createPipeline({
      name: "Extract URLs",
      description: "Pull HTTP(S) URLs out of a blob of text",
      steps: [
        createPipelineStep("regex", {
          name: "Extract URLs",
          options: { mode: "extract-urls" },
        }),
      ],
      inputType: "text",
      outputType: "text",
      tags: ["regex", "extract"],
    }),
    createPipeline({
      name: "Normalize Identifiers",
      description: "Trim then convert text to snake_case",
      steps: [
        createPipelineStep("text", { name: "Trim", options: { mode: "trim" } }),
        createPipelineStep("case-converter", {
          name: "Snake case",
          options: { mode: "snake" },
        }),
      ],
      inputType: "text",
      outputType: "text",
      tags: ["text", "case"],
    }),
  ];
}
