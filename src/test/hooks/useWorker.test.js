import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useWorker } from "@/hooks/useWorker";
import { testWorkerScript } from "../workers/testWorkerScript";

describe("useWorker Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("initializes worker and sets isReady to true", async () => {
    let hookResult;
    function TestComponent() {
      hookResult = useWorker(testWorkerScript);
      return null;
    }

    render(<TestComponent />);
    await act(() => vi.advanceTimersByTime(100));

    expect(hookResult.isReady).toBe(true);
  });

  it("executes worker task and returns result", async () => {
    let hookResult;
    function TestComponent() {
      hookResult = useWorker(testWorkerScript);
      return null;
    }

    render(<TestComponent />);
    await act(() => vi.advanceTimersByTime(100));

    const promise = hookResult.execute("double", 5);
    await act(() => vi.advanceTimersByTime(100));

    await waitFor(() => {
      expect(promise).resolves.toBe(10);
    });
  });

  it("handles worker errors gracefully", async () => {
    let hookResult;
    function TestComponent() {
      hookResult = useWorker(testWorkerScript);
      return null;
    }

    render(<TestComponent />);
    await act(() => vi.advanceTimersByTime(100));

    const promise = hookResult.execute("error", null);
    await act(() => vi.advanceTimersByTime(100));

    await waitFor(() => {
      expect(promise).rejects.toThrow();
    });
  });

  it("terminates worker cleanup", async () => {
    let hookResult;
    function TestComponent() {
      hookResult = useWorker(testWorkerScript);
      return null;
    }

    render(<TestComponent />);
    await act(() => vi.advanceTimersByTime(100));

    expect(hookResult.isReady).toBe(true);

    hookResult.terminate();

    expect(hookResult.isReady).toBe(false);
  });

  it("respects maxConcurrent limit", async () => {
    let hookResult;
    const slowWorkerScript = `
      self.onmessage = function(e) {
        setTimeout(() => {
          self.postMessage({ id: e.data.id, success: true, result: e.data.data });
        }, 100);
      };
    `;

    function TestComponent() {
      hookResult = useWorker(slowWorkerScript, { maxConcurrent: 1 });
      return null;
    }

    render(<TestComponent />);
    await act(() => vi.advanceTimersByTime(100));

    const p1 = hookResult.execute("test", 1);
    const p2 = hookResult.execute("test", 2);

    await act(() => vi.advanceTimersByTime(50));
    expect(hookResult.queueLength).toBe(1);

    await act(() => vi.advanceTimersByTime(200));

    await p1;
    expect(p2).resolves.toBe(2);
  });

  it("clears queue properly", async () => {
    let hookResult;
    const slowWorkerScript = `
      self.onmessage = function(e) {
        setTimeout(() => {
          self.postMessage({ id: e.data.id, success: true, result: e.data.data });
        }, 500);
      };
    `;

    function TestComponent() {
      hookResult = useWorker(slowWorkerScript, { maxConcurrent: 1 });
      return null;
    }

    render(<TestComponent />);
    await act(() => vi.advanceTimersByTime(100));

    hookResult.execute("test", 1);
    hookResult.execute("test", 2);

    expect(hookResult.queueLength).toBe(1);

    hookResult.clearQueue();

    expect(hookResult.queueLength).toBe(0);
  });
});
