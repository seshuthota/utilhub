'use client';

import { CreateMLCEngine } from '@mlc-ai/web-llm';

// Singleton engine instance
let engineInstance = null;
let isLoading = false;
let loadProgress = 0;
let progressCallbacks = [];

// Model to use - Gemma 3 270M is small and fast
const MODEL_ID = 'gemma-2-2b-it-q4f16_1-MLC';

export function getLoadProgress() {
    return loadProgress;
}

export function onProgressUpdate(callback) {
    progressCallbacks.push(callback);
    return () => {
        progressCallbacks = progressCallbacks.filter(cb => cb !== callback);
    };
}

function notifyProgress(progress) {
    loadProgress = progress;
    progressCallbacks.forEach(cb => cb(progress));
}

export async function initEngine() {
    if (engineInstance) return engineInstance;
    if (isLoading) {
        // Wait for existing load to complete
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (engineInstance) {
                    clearInterval(checkInterval);
                    resolve(engineInstance);
                }
            }, 100);
        });
    }

    isLoading = true;
    notifyProgress(0);

    try {
        engineInstance = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: (progress) => {
                notifyProgress(Math.round(progress.progress * 100));
            },
        });
        notifyProgress(100);
        return engineInstance;
    } catch (error) {
        console.error('Failed to load WebLLM engine:', error);
        isLoading = false;
        throw error;
    }
}

export async function generate(prompt, systemPrompt = 'You are a helpful coding assistant. Be concise.') {
    const engine = await initEngine();

    const response = await engine.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 256,
    });

    return response.choices[0].message.content;
}

export function isEngineReady() {
    return engineInstance !== null;
}

export function isWebGPUSupported() {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
}
