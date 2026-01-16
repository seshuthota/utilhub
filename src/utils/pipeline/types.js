// Pipeline Types and Interfaces

export const PIPELINE_VERSION = "1.0.0";

// Standard I/O types that tools can accept/output
export const IO_TYPES = {
  TEXT: "text",
  JSON: "json",
  BASE64: "base64",
  HASH: "hash",
  YAML: "yaml",
  XML: "xml",
  CSV: "csv",
  HTML: "html",
  CSS: "css",
  JAVASCRIPT: "javascript",
  MARKDOWN: "markdown",
  IMAGE: "image",
  FORM_DATA: "form-data",
  URL_ENCODED: "url-encoded",
  JWT: "jwt",
  CONFIG: "config",
  UNKNOWN: "unknown",
};

// Pipeline step configuration
export const createPipelineStep = (toolId, options = {}) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).substr(2, 9),
  toolId,
  name: "",
  options: {},
  enabled: true,
  ...options,
});

// Pipeline configuration
export const createPipeline = (config = {}) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: "Untitled Pipeline",
  description: "",
  version: PIPELINE_VERSION,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [],
  inputType: IO_TYPES.TEXT,
  outputType: IO_TYPES.TEXT,
  isPublic: false,
  tags: [],
  ...config,
});

// Pipeline execution result
export const createExecutionResult = (stepIndex, result) => ({
  stepIndex,
  success: true,
  output: result.output,
  outputType: result.outputType || IO_TYPES.TEXT,
  metadata: result.metadata || {},
  timestamp: new Date().toISOString(),
});

// Pipeline execution state
export const ExecutionState = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
  ERROR: "error",
};

// Convert compatible types
export const TYPE_COMPATIBILITY = {
  [IO_TYPES.TEXT]: [
    IO_TYPES.TEXT,
    IO_TYPES.JSON,
    IO_TYPES.YAML,
    IO_TYPES.XML,
    IO_TYPES.CSV,
    IO_TYPES.HTML,
    IO_TYPES.CSS,
    IO_TYPES.JAVASCRIPT,
    IO_TYPES.MARKDOWN,
    IO_TYPES.BASE64,
    IO_TYPES.URL_ENCODED,
  ],
  [IO_TYPES.JSON]: [
    IO_TYPES.TEXT,
    IO_TYPES.JSON,
    IO_TYPES.YAML,
    IO_TYPES.BASE64,
  ],
  [IO_TYPES.YAML]: [
    IO_TYPES.TEXT,
    IO_TYPES.JSON,
    IO_TYPES.YAML,
    IO_TYPES.BASE64,
  ],
  [IO_TYPES.XML]: [IO_TYPES.TEXT, IO_TYPES.XML, IO_TYPES.BASE64],
  [IO_TYPES.CSV]: [IO_TYPES.TEXT, IO_TYPES.CSV, IO_TYPES.JSON],
  [IO_TYPES.BASE64]: [IO_TYPES.TEXT, IO_TYPES.BASE64],
  [IO_TYPES.HTML]: [IO_TYPES.TEXT, IO_TYPES.HTML],
  [IO_TYPES.CSS]: [IO_TYPES.TEXT, IO_TYPES.CSS],
  [IO_TYPES.JAVASCRIPT]: [IO_TYPES.TEXT, IO_TYPES.JAVASCRIPT, IO_TYPES.JSON],
  [IO_TYPES.MARKDOWN]: [IO_TYPES.TEXT, IO_TYPES.MARKDOWN, IO_TYPES.HTML],
  [IO_TYPES.IMAGE]: [IO_TYPES.IMAGE],
  [IO_TYPES.JWT]: [IO_TYPES.TEXT, IO_TYPES.JWT, IO_TYPES.JSON],
  [IO_TYPES.HASH]: [IO_TYPES.TEXT, IO_TYPES.HASH],
};

export const canConvert = (fromType, toType) => {
  const compatible = TYPE_COMPATIBILITY[fromType] || [];
  return compatible.includes(toType);
};
