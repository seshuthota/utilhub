import { useState, useCallback, useMemo } from "react";

const SIZE_THRESHOLDS = {
    warning: 1024 * 1024, // 1MB - show warning
    heavy: 5 * 1024 * 1024, // 5MB - show heavy warning
    critical: 10 * 1024 * 1024, // 10MB - critical limit
};

interface UseInputSizeOptions {
    warningThreshold?: number;
    heavyThreshold?: number;
    criticalThreshold?: number;
    onSizeExceeded?: (size: number, maxSize: number) => void;
    maxSize?: number;
}

export type InputSizeStatus = "idle" | "critical" | "heavy" | "warning" | "normal";

export function useInputSize(options: UseInputSizeOptions = {}) {
    const {
        warningThreshold = SIZE_THRESHOLDS.warning,
        heavyThreshold = SIZE_THRESHOLDS.heavy,
        criticalThreshold = SIZE_THRESHOLDS.critical,
        onSizeExceeded = () => { },
        maxSize = SIZE_THRESHOLDS.critical,
    } = options;

    const [size, setSize] = useState(0);
    const [content, setContent] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const sizeKB = useMemo(() => (size / 1024).toFixed(2), [size]);
    const sizeMB = useMemo(() => (size / (1024 * 1024)).toFixed(2), [size]);

    const status: InputSizeStatus = useMemo(() => {
        if (size === 0) return "idle";
        if (size > criticalThreshold) return "critical";
        if (size > heavyThreshold) return "heavy";
        if (size > warningThreshold) return "warning";
        return "normal";
    }, [size, warningThreshold, heavyThreshold, criticalThreshold]);

    const estimatedTime = useMemo(() => {
        if (size === 0) return null;

        const kbPerMs = 100;
        const baseTime = 50;
        const estimatedMs = baseTime + size / 1024 / kbPerMs;

        if (estimatedMs < 1000) return `${Math.round(estimatedMs)}ms`;
        if (estimatedMs < 5000) return `${(estimatedMs / 1000).toFixed(1)}s`;
        return `${Math.round(estimatedMs / 1000)}s`;
    }, [size]);

    const setInput = useCallback(
        (newContent: string) => {
            const newSize = newContent ? newContent.length : 0;
            setSize(newSize);
            setContent(newContent);

            if (newSize > maxSize) {
                onSizeExceeded(newSize, maxSize);
            }
        },
        [maxSize, onSizeExceeded],
    );

    const reset = useCallback(() => {
        setSize(0);
        setContent("");
        setProgress(0);
        setIsProcessing(false);
    }, []);

    const startProcessing = useCallback(() => {
        setIsProcessing(true);
        setProgress(0);
    }, []);

    const updateProgress = useCallback((value: number) => {
        setProgress(Math.min(100, Math.max(0, value)));
    }, []);

    const finishProcessing = useCallback(() => {
        setIsProcessing(false);
        setProgress(100);
    }, []);

    const shouldUseWorker = size > warningThreshold;
    const canProcess = size <= maxSize || maxSize === 0;

    return {
        size,
        sizeKB,
        sizeMB,
        content,
        status,
        estimatedTime,
        isProcessing,
        progress,
        thresholds: {
            warning: warningThreshold,
            heavy: heavyThreshold,
            critical: criticalThreshold,
        },
        shouldUseWorker,
        canProcess,
        setInput,
        reset,
        startProcessing,
        updateProgress,
        finishProcessing,
    };
}

export function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getProcessingEstimate(size: number, operation: string) {
    if (size === 0) return null;

    const baseTime: Record<string, number> = {
        json: 0.5,
        hash: 0.2,
        diff: 0.8,
        beautify: 1.2,
        minify: 0.3,
    };

    const factor = baseTime[operation] || 0.5;
    const kb = size / 1024;
    const ms = factor * kb + 50;

    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 5000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 1000)}s`;
}
