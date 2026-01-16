"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Play,
  Save,
  Share2,
  Copy,
  Download,
  GripVertical,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
} from "lucide-react";
import {
  usePipeline,
  usePipelineExecution,
  usePipelineStorage,
  usePipelineExamples,
  useCompatibleTools,
} from "@/hooks/usePipeline";
import { getToolAdapter, getExamplePipelines } from "@/utils/pipeline";
import { tools } from "@/config/tools";
import styles from "./page.module.css";

function ToolSelector({ onSelect, onClose }) {
  const compatibleTools = useCompatibleTools();

  return (
    <div className={styles.toolSelector}>
      <div className={styles.toolSelectorHeader}>
        <h3>Add Tool</h3>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={18} />
        </button>
      </div>
      <div className={styles.toolList}>
        {compatibleTools.map((tool) => {
          const adapter = getToolAdapter(tool.id);
          return (
            <button
              key={tool.id}
              className={styles.toolItem}
              onClick={() => onSelect(tool.id)}
            >
              <tool.icon size={20} />
              <span>{tool.title}</span>
              {adapter && (
                <span className={styles.toolModes}>
                  {adapter.modes.length} mode
                  {adapter.modes.length > 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepOptions({ step, onUpdate, onRemove }) {
  const adapter = getToolAdapter(step.toolId);
  if (!adapter) return null;

  return (
    <div className={styles.stepOptions}>
      <div className={styles.optionGroup}>
        <label>Mode</label>
        <select
          value={step.options?.mode || adapter.defaultMode || ""}
          onChange={(e) =>
            onUpdate(step.id, {
              options: { ...step.options, mode: e.target.value },
            })
          }
        >
          {adapter.modes.map((mode) => (
            <option key={mode} value={mode}>
              {mode.replace(/-/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.stepActions}>
        <button
          className={styles.removeBtn}
          onClick={() => onRemove(step.id)}
          title="Remove step"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function PipelineStep({ step, index, onUpdate, onRemove, isActive, onClick }) {
  const adapter = getToolAdapter(step.toolId);
  const Icon = adapter ? tools.find((t) => t.id === step.toolId)?.icon : null;

  return (
    <div
      className={`${styles.stepCard} ${isActive ? styles.activeStep : ""}`}
      onClick={onClick}
    >
      <div className={styles.stepDragHandle}>
        <GripVertical size={16} />
      </div>

      <div className={styles.stepNumber}>{index + 1}</div>

      <div className={styles.stepIcon}>{Icon && <Icon size={20} />}</div>

      <div className={styles.stepInfo}>
        <div className={styles.stepName}>
          {step.name || adapter?.name || step.toolId}
        </div>
        {adapter && (
          <div className={styles.stepMeta}>
            {step.options?.mode || adapter.defaultMode}
          </div>
        )}
      </div>

      <StepOptions step={step} onUpdate={onUpdate} onRemove={onRemove} />
    </div>
  );
}

function ResultsPanel({ results, currentStep, error }) {
  if (results.length === 0) return null;

  return (
    <div className={styles.resultsPanel}>
      <div className={styles.resultsHeader}>
        <h3>Results</h3>
        <span className={styles.resultCount}>
          {results.length} step{results.length > 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.resultsList}>
        {results.map((result, index) => (
          <div
            key={index}
            className={`${styles.resultItem} ${index === currentStep ? styles.activeResult : ""}`}
          >
            <div className={styles.resultHeader}>
              <span className={styles.resultStep}>
                {result.stepName || `Step ${result.stepIndex + 1}`}
              </span>
              {result.success ? (
                <CheckCircle size={14} className={styles.successIcon} />
              ) : (
                <AlertCircle size={14} className={styles.errorIcon} />
              )}
            </div>
            <div className={styles.resultPreview}>
              {result.output?.substring(0, 100)}
              {result.output?.length > 100 && "..."}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExamplePipelines({ onLoad }) {
  const examples = getExamplePipelines();

  return (
    <div className={styles.exampleSection}>
      <h3>Start from Example</h3>
      <div className={styles.exampleGrid}>
        {examples.map((pipeline) => (
          <button
            key={pipeline.id}
            className={styles.exampleCard}
            onClick={() => onLoad(pipeline)}
          >
            <span className={styles.exampleName}>{pipeline.name}</span>
            <span className={styles.exampleDesc}>{pipeline.description}</span>
            <span className={styles.exampleSteps}>
              {pipeline.steps.length} steps
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PipelineBuilder() {
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("builder"); // builder | results | saved

  const {
    pipeline,
    updatePipeline,
    addStep,
    removeStep,
    updateStep,
    save,
    isDirty,
  } = usePipeline();

  const {
    execute,
    results,
    currentStep,
    isExecuting,
    error,
    finalOutput,
    reset: resetExecution,
  } = usePipelineExecution();

  const {
    pipelines: savedPipelines,
    save: saveToStorage,
    remove: removeFromStorage,
    getShareUrl,
    loadAll,
  } = usePipelineStorage();

  const handleRunPipeline = useCallback(async () => {
    if (!inputValue.trim()) return;
    await execute(pipeline, inputValue);
    setActiveTab("results");
  }, [pipeline, inputValue, execute]);

  const handleSave = useCallback(() => {
    save();
    saveToStorage(pipeline);
  }, [save, saveToStorage, pipeline]);

  const handleShare = useCallback(() => {
    const url = getShareUrl(pipeline);
    navigator.clipboard.writeText(url);
    alert("Share URL copied to clipboard!");
  }, [pipeline, getShareUrl]);

  const handleLoadExample = useCallback(
    (examplePipeline) => {
      updatePipeline(examplePipeline);
    },
    [updatePipeline],
  );

  const handleLoadSaved = useCallback(
    (savedPipeline) => {
      updatePipeline(savedPipeline);
      setActiveTab("builder");
    },
    [updatePipeline],
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Pipeline Builder</h1>
          {isDirty && (
            <span className={styles.dirtyIndicator}>Unsaved changes</span>
          )}
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.actionBtn}
            onClick={handleShare}
            title="Share"
          >
            <Share2 size={16} /> Share
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleSave}
            title="Save"
          >
            <Save size={16} /> Save
          </button>
          <button
            className={styles.runBtn}
            onClick={handleRunPipeline}
            disabled={
              isExecuting || pipeline.steps.length === 0 || !inputValue.trim()
            }
          >
            {isExecuting ? (
              <>
                <Clock size={16} className="animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play size={16} /> Run Pipeline
              </>
            )}
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "builder" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("builder")}
        >
          Builder
        </button>
        <button
          className={`${styles.tab} ${activeTab === "results" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("results")}
        >
          Results {results.length > 0 && `(${results.length})`}
        </button>
        <button
          className={`${styles.tab} ${activeTab === "saved" ? styles.activeTab : ""}`}
          onClick={() => {
            loadAll();
            setActiveTab("saved");
          }}
        >
          Saved Pipelines
        </button>
      </div>

      {activeTab === "builder" && (
        <div className={styles.builderContent}>
          <div className={styles.mainPanel}>
            <div className={styles.inputSection}>
              <label>Input</label>
              <textarea
                className={styles.inputArea}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter your input here..."
              />
            </div>

            <div className={styles.stepsSection}>
              <div className={styles.stepsHeader}>
                <h3>Pipeline Steps</h3>
                <button
                  className={styles.addStepBtn}
                  onClick={() => setShowToolSelector(true)}
                >
                  <Plus size={16} /> Add Step
                </button>
              </div>

              <div className={styles.stepsList}>
                {pipeline.steps.length === 0 ? (
                  <div className={styles.emptySteps}>
                    <p>No steps added yet</p>
                    <button onClick={() => setShowToolSelector(true)}>
                      Add your first step
                    </button>
                  </div>
                ) : (
                  pipeline.steps.map((step, index) => (
                    <PipelineStep
                      key={step.id}
                      step={step}
                      index={index}
                      onUpdate={updateStep}
                      onRemove={removeStep}
                      isActive={currentStep === index}
                      onClick={() => {}}
                    />
                  ))
                )}
              </div>

              {pipeline.steps.length > 0 && (
                <div className={styles.flowIndicator}>
                  <ArrowRight size={20} />
                  <span>
                    Input → {pipeline.steps.map((s) => s.toolId).join(" → ")} →
                    Output
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.pipelineInfo}>
              <label>Pipeline Name</label>
              <input
                type="text"
                value={pipeline.name}
                onChange={(e) => updatePipeline({ name: e.target.value })}
                placeholder="My Pipeline"
                className={styles.nameInput}
              />

              <label>Description</label>
              <textarea
                value={pipeline.description || ""}
                onChange={(e) =>
                  updatePipeline({ description: e.target.value })
                }
                placeholder="What does this pipeline do?"
                className={styles.descInput}
              />
            </div>

            <ExamplePipelines onLoad={handleLoadExample} />
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className={styles.resultsContent}>
          <div className={styles.inputPreview}>
            <h3>Input</h3>
            <pre>{inputValue}</pre>
          </div>

          <ResultsPanel
            results={results}
            currentStep={results.length - 1}
            error={error}
          />

          {finalOutput && (
            <div className={styles.finalOutput}>
              <h3>Final Output</h3>
              <pre>{finalOutput}</pre>
              <button
                className={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(finalOutput)}
              >
                <Copy size={14} /> Copy
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className={styles.savedContent}>
          {savedPipelines.length === 0 ? (
            <div className={styles.emptySaved}>
              <p>No saved pipelines yet</p>
              <p>Create a pipeline and save it to see it here</p>
            </div>
          ) : (
            <div className={styles.savedList}>
              {savedPipelines.map((p) => (
                <div key={p.id} className={styles.savedItem}>
                  <div className={styles.savedInfo}>
                    <span className={styles.savedName}>{p.name}</span>
                    <span className={styles.savedMeta}>
                      {p.steps.length} steps • Updated{" "}
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.savedActions}>
                    <button onClick={() => handleLoadSaved(p)}>Load</button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getShareUrl(p));
                      }}
                    >
                      Share
                    </button>
                    <button
                      onClick={() => removeFromStorage(p.id)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showToolSelector && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowToolSelector(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ToolSelector
              onSelect={(toolId) => {
                addStep(toolId);
                setShowToolSelector(false);
              }}
              onClose={() => setShowToolSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
