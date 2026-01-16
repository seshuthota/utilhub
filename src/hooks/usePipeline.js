// Pipeline Hooks

import { useState, useCallback, useEffect } from "react";
import {
  createPipeline,
  createPipelineStep,
  getPipelineEngine,
  getToolAdapter,
  getPipelineCompatibleTools,
  savePipeline,
  loadPipeline,
  getStoredPipelines,
  deletePipeline,
  loadFromUrl,
  generateShareUrl,
  duplicatePipeline,
  getExamplePipelines,
} from "@/utils/pipeline";

export function usePipeline(initialPipeline = null) {
  const [pipeline, setPipeline] = useState(initialPipeline || createPipeline());
  const [isDirty, setIsDirty] = useState(false);

  const updatePipeline = useCallback((updates) => {
    setPipeline((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const addStep = useCallback((toolId, options = {}) => {
    const adapter = getToolAdapter(toolId);
    const step = createPipelineStep(toolId, {
      name: adapter?.name || toolId,
      options,
    });

    setPipeline((prev) => ({
      ...prev,
      steps: [...prev.steps, step],
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);

    return step;
  }, []);

  const removeStep = useCallback((stepId) => {
    setPipeline((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const updateStep = useCallback((stepId, updates) => {
    setPipeline((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s,
      ),
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const reorderSteps = useCallback((fromIndex, toIndex) => {
    setPipeline((prev) => {
      const steps = [...prev.steps];
      const [removed] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, removed);
      return {
        ...prev,
        steps,
        updatedAt: new Date().toISOString(),
      };
    });
    setIsDirty(true);
  }, []);

  const resetPipeline = useCallback(() => {
    setPipeline(initialPipeline || createPipeline());
    setIsDirty(false);
  }, [initialPipeline]);

  const save = useCallback(() => {
    savePipeline(pipeline);
    setIsDirty(false);
  }, [pipeline]);

  return {
    pipeline,
    setPipeline: setPipeline,
    updatePipeline,
    addStep,
    removeStep,
    updateStep,
    reorderSteps,
    resetPipeline,
    save,
    isDirty,
  };
}

export function usePipelineExecution() {
  const [results, setResults] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [finalOutput, setFinalOutput] = useState(null);

  const engine = getPipelineEngine();

  const execute = useCallback(
    async (pipeline, input) => {
      setIsExecuting(true);
      setError(null);
      setResults([]);
      setCurrentStep(-1);
      setFinalOutput(null);

      const result = await engine.execute(pipeline, input);

      if (result.success) {
        setResults(result.results);
        setCurrentStep(result.results.length - 1);
        setFinalOutput(result.finalOutput);
      } else {
        setError(result.error);
        setResults(result.results);
        setCurrentStep(result.step);
      }

      setIsExecuting(false);
      return result;
    },
    [engine],
  );

  const reset = useCallback(() => {
    setResults([]);
    setCurrentStep(-1);
    setError(null);
    setFinalOutput(null);
    setIsExecuting(false);
  }, []);

  return {
    execute,
    reset,
    results,
    currentStep,
    isExecuting,
    error,
    finalOutput,
  };
}

export function usePipelineStorage() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(() => {
    setLoading(true);
    try {
      setPipelines(getStoredPipelines());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const save = useCallback(
    (pipeline) => {
      savePipeline(pipeline);
      loadAll();
    },
    [loadAll],
  );

  const remove = useCallback(
    (id) => {
      deletePipeline(id);
      loadAll();
    },
    [loadAll],
  );

  const duplicate = useCallback(
    (pipeline) => {
      const newPipeline = duplicatePipeline(pipeline);
      loadAll();
      return newPipeline;
    },
    [loadAll],
  );

  const getShareUrl = useCallback((pipeline) => {
    return generateShareUrl(pipeline);
  }, []);

  return {
    pipelines,
    loading,
    loadAll,
    save,
    remove,
    duplicate,
    getShareUrl,
  };
}

export function useUrlPipeline() {
  const [pipeline, setPipeline] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loaded = loadFromUrl(params);

    if (loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPipeline(loaded);
    } else if (params.has("p")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Invalid pipeline URL");
    }
  }, []);

  return { pipeline, error };
}

export function usePipelineExamples() {
  return getExamplePipelines();
}

export function useCompatibleTools() {
  return getPipelineCompatibleTools();
}
