'use client';

import { Sparkles } from 'lucide-react';
import AiAssistButton from './AiAssistButton';
import styles from './AiAssistBar.module.css';

/**
 * Combined input and button component for AI assistance.
 * Manages the description input and passes it to the AI generation logic.
 *
 * @param {Object} props
 * @param {string} props.prompt - Current value of the input
 * @param {Function} props.onPromptChange - Callback when input changes
 * @param {string} props.type - AI generation task type
 * @param {Object} [props.payload={}] - Additional data for the AI task
 * @param {Function} props.onResult - Callback receiving AI result
 * @param {string} [props.placeholder="Ask AI..."] - Input placeholder
 * @param {string} [props.className] - Additional classes
 */
export default function AiAssistBar({
    prompt,
    onPromptChange,
    type,
    payload = {},
    onResult,
    placeholder = "Ask AI...",
    className = ''
}) {
    // Merge description into payload if not already present, 
    // though typically the consumer constructs the payload.
    // Let's assume consumer passes `payload={{ description: prompt, ...other }}`
    // But `AiAssistBar` knows `prompt` is the description.
    // To make it easy: payloadBuilder?
    // Or just let consumer pass full payload, but that's redundant if prompt is here.

    // Let's standardize: The bar manages the 'description' part of the payload.
    // The consumer passes `basePayload` (rest of data).

    const fullPayload = { ...payload, description: prompt };

    return (
        <div className={`${styles.container} ${className}`}>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={placeholder}
                    className={styles.input}
                />
                <AiAssistButton
                    type={type}
                    payload={fullPayload}
                    onResult={onResult}
                    disabled={!prompt.trim()}
                />
            </div>
        </div>
    );
}
