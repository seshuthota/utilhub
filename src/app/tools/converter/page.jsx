"use client";

import { useState, useCallback, useEffect } from "react";
import yaml from "js-yaml";
import TOML from "@iarna/toml";
import { Settings, FileJson, ArrowRightLeft, AlertCircle } from "lucide-react";
import { useUrlState } from "@/hooks/useUrlState";
import CodeEditor from "@/components/common/CodeEditor";
import ActionToolbar from "@/components/common/ActionToolbar";
import styles from "./page.module.css";

const EXAMPLE_JSON = `{
  "title": "Example",
  "owner": {
    "name": "Tom Preston-Werner",
    "dob": "1979-05-27T07:32:00-08:00"
  },
  "database": {
    "enabled": true,
    "ports": [8000, 8001, 8002],
    "data": [ ["delta", "phi"], [3.14] ]
  }
}`;

const FORMATS = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "toml", label: "TOML" },
];

export default function ConfigConverter() {
  const [input, setInput] = useUrlState("content", "");
  const [output, setOutput] = useState("");
  const [sourceFmt, setSourceFmt] = useUrlState("from", "json");
  const [targetFmt, setTargetFmt] = useUrlState("to", "yaml");
  const [error, setError] = useState(null);

  const parseContent = (content, format) => {
    switch (format) {
      case "json":
        return JSON.parse(content);
      case "yaml":
        return yaml.load(content);
      case "toml":
        return TOML.parse(content);
      default:
        throw new Error("Unknown format");
    }
  };

  const stringifyContent = (obj, format) => {
    switch (format) {
      case "json":
        return JSON.stringify(obj, null, 2);
      case "yaml":
        return yaml.dump(obj);
      case "toml":
        return TOML.stringify(obj);
      default:
        throw new Error("Unknown format");
    }
  };

  const convert = useCallback((content, from, to) => {
    if (!content.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      const obj = parseContent(content, from);
      if (typeof obj !== "object" || obj === null) {
        // Handle scalar results (valid YAML but not useful for conversion usually)
      }
      const result = stringifyContent(obj, to);
      setOutput(result);
      setError(null);
    } catch (e) {
      console.error(e);
      setOutput("");
      setError(e.message || "Conversion failed");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      convert(input, sourceFmt, targetFmt);
    }, 0);
    return () => clearTimeout(timer);
  }, [input, sourceFmt, targetFmt, convert]);

  const handleSwap = () => {
    setSourceFmt(targetFmt);
    setTargetFmt(sourceFmt);
    setInput(output); // Optional: Swap content too? Yes, usually expected.
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Settings size={24} className="text-primary" />
          <h1 className={styles.title}>Config Converter</h1>
        </div>
        <button
          className="btn-secondary"
          onClick={() => setInput(EXAMPLE_JSON)}
        >
          Load Example
        </button>
      </header>

      <div className={styles.main}>
        <div className={styles.splitView}>
          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>Input:</span>
                <select
                  className={styles.select}
                  value={sourceFmt}
                  onChange={(e) => setSourceFmt(e.target.value)}
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-icon"
                onClick={handleSwap}
                title="Swap Formats"
              >
                <ArrowRightLeft size={16} />
              </button>
            </div>
            <div className={styles.editorArea}>
              <CodeEditor
                value={input}
                onChange={setInput}
                language={sourceFmt}
                placeholder={`Paste ${sourceFmt.toUpperCase()} here...`}
              />
            </div>
            {error && (
              <div className={styles.error}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <AlertCircle size={16} />{" "}
                  <strong>Error parsing {sourceFmt.toUpperCase()}</strong>
                </div>
                {error}
              </div>
            )}
          </div>

          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>Output:</span>
                <select
                  className={styles.select}
                  value={targetFmt}
                  onChange={(e) => setTargetFmt(e.target.value)}
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <ActionToolbar
                content={output}
                currentToolId="config-converter"
              />
            </div>
            <div className={styles.editorArea}>
              <CodeEditor
                value={output}
                readOnly={true}
                language={targetFmt}
                placeholder="Output will appear here..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
