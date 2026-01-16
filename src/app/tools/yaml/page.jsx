"use client";

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import { FileText, ArrowRightLeft, Copy, Trash2, Braces } from "lucide-react";
import CodeEditor from "@/components/common/CodeEditor";
import { useToast } from "@/components/Toast";
import styles from "./page.module.css";

export default function YamlTool() {
  const [input, setInput] = useState(
    "name: UtilHub\nversion: 1.0.0\nfeatures:\n  - yaml\n  - json",
  );
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("yaml2json"); // yaml2json | json2yaml
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  function convert(val, currentMode) {
    try {
      if (!val.trim()) {
        setOutput("");
        setError(null);
        return;
      }

      if (currentMode === "yaml2json") {
        const obj = yaml.load(val);
        setOutput(JSON.stringify(obj, null, 2));
      } else {
        const obj = JSON.parse(val);
        setOutput(yaml.dump(obj));
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  // Auto-convert
  useEffect(() => {
    const timer = setTimeout(() => {
      convert(input, mode);
    }, 0);
    return () => clearTimeout(timer);
  }, [input, mode]);

  const handleModeToggle = () => {
    const newMode = mode === "yaml2json" ? "json2yaml" : "yaml2json";
    setMode(newMode);
    setInput(output); // Swap output to input
    convert(output, newMode);
    showToast(
      `Switched to ${newMode === "yaml2json" ? "YAML to JSON" : "JSON to YAML"}`,
      "success",
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard", "success");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>YAML &lt;&gt; JSON Converter</h1>
        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={handleModeToggle}
            title="Switch Mode"
          >
            <ArrowRightLeft size={16} />{" "}
            {mode === "yaml2json" ? "YAML to JSON" : "JSON to YAML"}
          </button>
          <button
            className={styles.button}
            onClick={() => setInput("")}
            title="Clear"
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.split}>
        <div className={styles.pane}>
          <div className={styles.paneHeader}>
            <span>{mode === "yaml2json" ? "YAML Input" : "JSON Input"}</span>
            <span className={styles.languageBadge}>
              {mode === "yaml2json" ? "YAML" : "JSON"}
            </span>
          </div>
          <div className={styles.editorWrapper}>
            <CodeEditor
              value={input}
              onChange={(val) => setInput(val)}
              language={mode === "yaml2json" ? "yaml" : "json"}
              placeholder="Type here..."
            />
          </div>
        </div>

        <div className={styles.pane}>
          <div className={styles.paneHeader}>
            {mode === "yaml2json" ? "JSON Output" : "YAML Output"}
            <button className={styles.copyBtn} onClick={handleCopy}>
              <Copy size={14} />
            </button>
          </div>
          <div className={styles.editorWrapper}>
            <CodeEditor
              value={output}
              onChange={() => {}} // Read-only mostly
              language={mode === "yaml2json" ? "json" : "yaml"}
              readOnly={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
