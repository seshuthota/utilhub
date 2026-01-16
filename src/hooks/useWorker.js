"use client";

import { useCallback, useRef, useState, useEffect } from "react";

let workerIdCounter = 0;

export function useWorker(workerScript, options = {}) {
  const {
    maxConcurrent = 2,
    timeout = 30000,
    onProgress = () => {},
    onError = (err) => console.error("Worker error:", err),
  } = options;

  const workerRef = useRef(null);
  const pendingRequests = useRef(new Map());
  const queueRef = useRef([]);
  const activeCount = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [lastError, setLastError] = useState(null);

  const initializeWorker = useCallback(() => {
    if (typeof workerScript === "string") {
      const blob = new Blob([workerScript], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      workerRef.current = new Worker(url);

      workerRef.current.onmessage = (e) => {
        const { id, success, result, error, progress } = e.data;

        if (progress !== undefined) {
          onProgress(progress);
          return;
        }

        const pending = pendingRequests.current.get(id);
        if (pending) {
          pendingRequests.current.delete(id);
          activeCount.current--;

          if (success) {
            pending.resolve(result);
          } else {
            const err = new Error(error);
            pending.reject(err);
            setLastError(error);
          }

          processQueue();
        }
      };

      workerRef.current.onerror = (e) => {
        onError(e);
        setLastError(e.message);
      };

      setIsReady(true);
    }
  }, [workerScript, onProgress, onError]);

  const processQueue = useCallback(() => {
    if (!workerRef.current || queueRef.current.length === 0) return;

    if (activeCount.current >= maxConcurrent) return;

    const next = queueRef.current.shift();
    if (!next) return;

    activeCount.current++;
    workerRef.current.postMessage(next.task);
  }, [maxConcurrent]);

  const execute = useCallback(
    (action, data, transferables = []) => {
      return new Promise((resolve, reject) => {
        const id = ++workerIdCounter;

        const task = {
          id,
          action,
          data,
          transferables,
        };

        if (!workerRef.current) {
          reject(new Error("Worker not initialized"));
          return;
        }

        if (activeCount.current < maxConcurrent) {
          activeCount.current++;
          workerRef.current.postMessage(task, transferables);
          pendingRequests.current.set(id, { resolve, reject });
        } else {
          queueRef.current.push({ task, resolve, reject });
        }

        if (timeout > 0) {
          setTimeout(() => {
            if (pendingRequests.current.has(id)) {
              pendingRequests.current.delete(id);
              reject(new Error("Worker task timed out"));
              activeCount.current--;
              processQueue();
            }
          }, timeout);
        }
      });
    },
    [maxConcurrent, timeout, processQueue],
  );

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
    }
    pendingRequests.current.clear();
    queueRef.current = [];
    activeCount.current = 0;
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current.forEach(({ reject }) => {
      reject(new Error("Queue cleared"));
    });
    queueRef.current = [];
  }, []);

  useEffect(() => {
    initializeWorker();
    return () => terminate();
  }, [initializeWorker, terminate]);

  return {
    execute,
    terminate,
    clearQueue,
    isReady,
    lastError,
    queueLength: queueRef.current.length,
  };
}

export function createWorkerScript(functions) {
  const functionStrings = Object.entries(functions)
    .map(([name, fn]) => `self.${name} = ${fn.toString()};`)
    .join("\n");

  return `
        ${functionStrings}
        self.onmessage = function(e) {
            const { action, data, id } = e.data;
            try {
                const result = self[action](data);
                self.postMessage({ id, success: true, result });
            } catch (error) {
                self.postMessage({ id, success: false, error: error.message });
            }
        };
    `;
}
