// Pipeline Execution Engine

import { ExecutionState, createExecutionResult } from "./types";
import { getToolAdapter, detectInputType, canConvert } from "./adapters";

class PipelineEngine {
  constructor() {
    this.state = ExecutionState.IDLE;
    this.results = [];
    this.currentStep = 0;
    this.error = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  // Reset engine state
  reset() {
    this.state = ExecutionState.IDLE;
    this.results = [];
    this.currentStep = 0;
    this.error = null;
  }

  // Execute a pipeline
  async execute(pipeline, input) {
    this.reset();
    this.state = ExecutionState.RUNNING;

    try {
      let currentInput = input;
      let currentType = detectInputType(input);

      // Add initial input result
      this.results.push({
        stepIndex: -1,
        stepName: "Input",
        output: input,
        outputType: currentType,
        success: true,
        timestamp: new Date().toISOString(),
      });

      // Notify progress
      if (this.onProgress) {
        this.onProgress({
          step: 0,
          totalSteps: pipeline.steps.length,
          currentOutput: input,
          currentType,
        });
      }

      // Execute each step
      for (let i = 0; i < pipeline.steps.length; i++) {
        const step = pipeline.steps[i];

        if (!step.enabled) {
          continue;
        }

        this.currentStep = i;

        const adapter = getToolAdapter(step.toolId);
        if (!adapter) {
          throw new Error(`Unknown tool: ${step.toolId}`);
        }

        // Check type compatibility
        if (!canConvert(currentType, adapter.inputTypes[0])) {
          // Try to auto-detect
          currentType = detectInputType(currentInput);
        }

        if (!canConvert(currentType, adapter.inputTypes[0])) {
          throw new Error(
            `Type mismatch at step ${i + 1}: Cannot convert ${currentType} to ${adapter.inputTypes[0]}`,
          );
        }

        // Execute the step
        const stepResult = await adapter.transform(
          currentInput,
          step.options || {},
        );

        if (stepResult.error) {
          throw new Error(
            `Step ${i + 1} (${adapter.name}): ${stepResult.error}`,
          );
        }

        currentInput = stepResult.output;
        currentType = stepResult.outputType;

        // Store result
        const result = {
          stepIndex: i,
          stepName: step.name || adapter.name,
          toolId: step.toolId,
          options: step.options || {},
          output: currentInput,
          outputType: currentType,
          success: true,
          timestamp: new Date().toISOString(),
        };

        this.results.push(result);

        // Notify progress
        if (this.onProgress) {
          this.onProgress({
            step: i + 1,
            totalSteps: pipeline.steps.length,
            currentOutput: currentInput,
            currentType,
            result,
          });
        }
      }

      this.state = ExecutionState.COMPLETED;

      if (this.onComplete) {
        this.onComplete({
          results: this.results,
          finalOutput: currentInput,
          finalType: currentType,
        });
      }

      return {
        success: true,
        results: this.results,
        finalOutput: currentInput,
        finalType: currentType,
      };
    } catch (error) {
      this.state = ExecutionState.ERROR;
      this.error = error.message;

      if (this.onError) {
        this.onError({
          error: error.message,
          step: this.currentStep,
          partialResults: this.results,
        });
      }

      return {
        success: false,
        error: error.message,
        results: this.results,
        step: this.currentStep,
      };
    }
  }

  // Execute a single step (for interactive mode)
  async executeStep(step, input) {
    const adapter = getToolAdapter(step.toolId);
    if (!adapter) {
      throw new Error(`Unknown tool: ${step.toolId}`);
    }

    const result = await adapter.transform(input, step.options || {});
    return result;
  }

  // Pause execution
  pause() {
    if (this.state === ExecutionState.RUNNING) {
      this.state = ExecutionState.PAUSED;
    }
  }

  // Resume execution
  resume() {
    if (this.state === ExecutionState.PAUSED) {
      this.state = ExecutionState.RUNNING;
    }
  }

  // Get current state
  getState() {
    return {
      state: this.state,
      currentStep: this.currentStep,
      results: this.results,
      error: this.error,
    };
  }

  // Set callbacks
  setCallbacks({ onProgress, onComplete, onError } = {}) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }
}

// Singleton instance
let engineInstance = null;

export function getPipelineEngine() {
  if (!engineInstance) {
    engineInstance = new PipelineEngine();
  }
  return engineInstance;
}

export { PipelineEngine };
