import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useInputSize,
  formatBytes,
  getProcessingEstimate,
} from "@/hooks/useInputSize";

describe("useInputSize Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with idle status and zero size", () => {
    const { result } = renderHook(() => useInputSize());

    expect(result.current.status).toBe("idle");
    expect(result.current.size).toBe(0);
    expect(result.current.sizeKB).toBe("0.00");
    expect(result.current.sizeMB).toBe("0.00");
    expect(result.current.content).toBe("");
  });

  it("updates size when input is set", () => {
    const { result } = renderHook(() => useInputSize());

    act(() => {
      result.current.setInput("test input data");
    });

    expect(result.current.size).toBe(15);
    expect(result.current.sizeKB).toBe("0.01");
    expect(result.current.content).toBe("test input data");
  });

  it("correctly identifies normal status for small input", () => {
    const { result } = renderHook(() =>
      useInputSize({
        warningThreshold: 1000,
        heavyThreshold: 5000,
        criticalThreshold: 10000,
      }),
    );

    act(() => {
      result.current.setInput("small");
    });

    expect(result.current.status).toBe("normal");
  });

  it("correctly identifies warning status", () => {
    const { result } = renderHook(() =>
      useInputSize({
        warningThreshold: 1000,
        heavyThreshold: 5000,
        criticalThreshold: 10000,
      }),
    );

    const largeInput = "x".repeat(1500);

    act(() => {
      result.current.setInput(largeInput);
    });

    expect(result.current.status).toBe("warning");
  });

  it("correctly identifies heavy status", () => {
    const { result } = renderHook(() =>
      useInputSize({
        warningThreshold: 1000,
        heavyThreshold: 5000,
        criticalThreshold: 10000,
      }),
    );

    const veryLargeInput = "x".repeat(6000);

    act(() => {
      result.current.setInput(veryLargeInput);
    });

    expect(result.current.status).toBe("heavy");
  });

  it("correctly identifies critical status", () => {
    const { result } = renderHook(() =>
      useInputSize({
        warningThreshold: 1000,
        heavyThreshold: 5000,
        criticalThreshold: 10000,
      }),
    );

    const hugeInput = "x".repeat(12000);

    act(() => {
      result.current.setInput(hugeInput);
    });

    expect(result.current.status).toBe("critical");
  });

  it("shouldUseWorker returns true for large input", () => {
    const { result } = renderHook(() =>
      useInputSize({
        warningThreshold: 1000,
        maxSize: 50000,
      }),
    );

    act(() => {
      result.current.setInput("x".repeat(2000));
    });

    expect(result.current.shouldUseWorker).toBe(true);
  });

  it("canProcess returns false when over maxSize", () => {
    const { result } = renderHook(() =>
      useInputSize({
        maxSize: 1000,
      }),
    );

    act(() => {
      result.current.setInput("x".repeat(1500));
    });

    expect(result.current.canProcess).toBe(false);
  });

  it("reset clears all state", () => {
    const { result } = renderHook(() => useInputSize());

    act(() => {
      result.current.setInput("test data");
      result.current.startProcessing();
      result.current.updateProgress(50);
    });

    expect(result.current.size).toBe(9);
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.progress).toBe(50);

    act(() => {
      result.current.reset();
    });

    expect(result.current.size).toBe(0);
    expect(result.current.content).toBe("");
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it("startProcessing and finishProcessing toggle isProcessing", () => {
    const { result } = renderHook(() => useInputSize());

    expect(result.current.isProcessing).toBe(false);

    act(() => {
      result.current.startProcessing();
    });

    expect(result.current.isProcessing).toBe(true);

    act(() => {
      result.current.finishProcessing();
    });

    expect(result.current.isProcessing).toBe(false);
  });

  it("updateProgress updates progress value", () => {
    const { result } = renderHook(() => useInputSize());

    act(() => {
      result.current.startProcessing();
      result.current.updateProgress(75);
    });

    expect(result.current.progress).toBe(75);
  });

  it("clamps progress between 0 and 100", () => {
    const { result } = renderHook(() => useInputSize());

    act(() => {
      result.current.updateProgress(150);
    });

    expect(result.current.progress).toBe(100);

    act(() => {
      result.current.updateProgress(-50);
    });

    expect(result.current.progress).toBe(0);
  });
});

describe("formatBytes utility", () => {
  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2 GB");
  });

  it("formats decimal values", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("getProcessingEstimate utility", () => {
  it("returns null for zero size", () => {
    expect(getProcessingEstimate(0, "json")).toBeNull();
  });

  it("returns milliseconds for small inputs", () => {
    const estimate = getProcessingEstimate(500, "json");
    expect(estimate).toContain("ms");
  });

  it("returns seconds for larger inputs", () => {
    const estimate = getProcessingEstimate(50000, "json");
    expect(estimate).toContain("s");
  });

  it("estimates faster for hash than json", () => {
    const jsonEstimate = getProcessingEstimate(10000, "json");
    const hashEstimate = getProcessingEstimate(10000, "hash");

    expect(jsonEstimate).not.toBe(hashEstimate);
  });
});
