"use client";

import { useState, useCallback, useEffect } from "react";
import yaml from "js-yaml";
import Ajv from "ajv";
import { ShieldCheck, AlertTriangle, CheckCircle, Upload } from "lucide-react";
import { useUrlState } from "@/hooks/useUrlState";
import CodeEditor from "@/components/common/CodeEditor";
import styles from "./page.module.css";

// Basic K8s Schema for demonstration (Validation of core fields)
const k8sBaseSchema = {
  type: "object",
  required: ["apiVersion", "kind", "metadata"],
  properties: {
    apiVersion: { type: "string" },
    kind: { type: "string" },
    metadata: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        namespace: { type: "string" },
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true });
const validateK8s = ajv.compile(k8sBaseSchema);

const EXAMPLE_YAML = `apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376`;

export default function YamlValidator() {
  const [input, setInput] = useUrlState("yaml", "");
  const [isValid, setIsValid] = useState(null);
  const [errors, setErrors] = useState([]);
  const [k8sStatus, setK8sStatus] = useState(null); // 'valid', 'invalid', 'not-k8s'

  const validate = useCallback((yamlContent) => {
    if (!yamlContent.trim()) {
      setIsValid(null);
      setErrors([]);
      setK8sStatus(null);
      return;
    }

    try {
      // 1. Syntax Check
      const parsed = yaml.load(yamlContent);
      setIsValid(true);
      setErrors([]);

      // 2. K8s Check
      if (typeof parsed === "object" && parsed !== null) {
        if (validateK8s(parsed)) {
          setK8sStatus("valid");
        } else {
          setK8sStatus("invalid");
          // Add Schema errors to the list
          const schemaErrors = validateK8s.errors.map((e) => ({
            message: `K8s Schema: ${e.instancePath} ${e.message}`,
            line: "N/A",
          }));
          setErrors((prev) => [...prev, ...schemaErrors]);
        }
      } else {
        setK8sStatus("not-k8s");
      }
    } catch (e) {
      setIsValid(false);
      setK8sStatus(null);
      setErrors([
        {
          message: e.reason || e.message,
          line: e.mark ? e.mark.line + 1 : "N/A",
          column: e.mark ? e.mark.column + 1 : "N/A",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      validate(input);
    }, 0);
    return () => clearTimeout(timer);
  }, [input, validate]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setInput(e.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ShieldCheck size={24} className="text-primary" />
          <h1 className={styles.title}>YAML & Kubernetes Validator</h1>
        </div>
        <div className={styles.controls}>
          <button
            className="btn-secondary"
            onClick={() => setInput(EXAMPLE_YAML)}
          >
            Load Example
          </button>
          <label
            className="btn-primary"
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
            }}
          >
            <Upload size={16} /> Upload YAML
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".yaml,.yml"
              style={{ display: "none" }}
            />
          </label>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.splitView}>
          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span>Input YAML</span>
            </div>
            <div className={styles.editorArea}>
              <CodeEditor
                value={input}
                onChange={setInput}
                language="yaml"
                placeholder="Paste YAML here..."
              />
            </div>
          </div>

          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span>Validation Results</span>
            </div>
            <div className={styles.resultsArea}>
              {isValid === true && (
                <div className={styles.valid}>
                  <CheckCircle size={20} />
                  <div>
                    Valid YAML Syntax
                    {k8sStatus === "valid" && (
                      <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                        ✓ Valid Basic Kubernetes Resource
                      </div>
                    )}
                    {k8sStatus === "invalid" && (
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--error-color)",
                        }}
                      >
                        ⚠ Invalid Kubernetes Structure
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div>
                  <div className={styles.invalid}>
                    <AlertTriangle size={20} />
                    Found {errors.length} Issue{errors.length > 1 ? "s" : ""}
                  </div>
                  <ul className={styles.errorList}>
                    {errors.map((err, idx) => (
                      <li key={idx} className={styles.errorItem}>
                        {err.line !== "N/A" && (
                          <span className={styles.errorLocation}>
                            Line {err.line}:
                          </span>
                        )}
                        {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isValid === null && !errors.length && (
                <div
                  style={{
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    marginTop: "2rem",
                  }}
                >
                  Enter YAML to validate...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
