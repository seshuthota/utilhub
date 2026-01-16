export class WorkerPool {
  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers;
    this.queue = [];
    this.workers = [];
    this.activeCount = 0;
  }

  execute(task) {
    return new Promise((resolve, reject) => {
      const runTask = () => {
        if (this.activeCount < this.maxWorkers) {
          this.activeCount++;
          task()
            .then((result) => {
              this.activeCount--;
              resolve(result);
              this.processQueue();
            })
            .catch((error) => {
              this.activeCount--;
              reject(error);
              this.processQueue();
            });
        } else {
          this.queue.push({ runTask, resolve, reject });
        }
      };
      runTask();
    });
  }

  processQueue() {
    if (this.queue.length > 0) {
      const { runTask, resolve, reject } = this.queue.shift();
      runTask().then(resolve).catch(reject);
    }
  }
}

export function createWorker(workerScript) {
  const blob = new Blob([workerScript], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);
  return new Worker(workerUrl);
}

export function terminateWorker(worker) {
  if (worker && worker.terminate) {
    worker.terminate();
    URL.revokeObjectObjectURL(worker);
  }
}

export function useWorker(workerScript, onMessage, onError) {
  const workerRef = { current: null };

  const postMessage = (data, transferable = []) => {
    if (workerRef.current) {
      workerRef.current.postMessage(data, transferable);
    }
  };

  const terminate = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  const initialize = () => {
    if (typeof workerScript === "string") {
      workerRef.current = createWorker(workerScript);
    } else {
      workerRef.current = workerScript;
    }

    workerRef.current.onmessage = (e) => {
      onMessage(e.data);
    };

    workerRef.current.onerror = (e) => {
      if (onError) onError(e);
      else console.error("Worker error:", e);
    };
  };

  return { postMessage, terminate, initialize, workerRef };
}
