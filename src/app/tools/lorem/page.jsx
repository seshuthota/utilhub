'use client';

import { useState } from 'react';
import { loremIpsum } from 'lorem-ipsum';
import { Copy, RefreshCw, Type, AlignLeft } from 'lucide-react';
import AiAssistButton from '@/components/common/AiAssistButton';
import styles from './page.module.css';

export default function LoremTool() {
    const [count, setCount] = useState(3);
    const [unit, setUnit] = useState('paragraphs'); // paragraphs | sentences | words
    const [output, setOutput] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');

    const handleAiResult = (response) => {
        setOutput(response.trim());
    };

    const generate = () => {
        const text = loremIpsum({
            count: count,
            format: 'plain',
            paragraphLowerBound: 3,
            paragraphUpperBound: 7,
            random: Math.random,
            sentenceLowerBound: 5,
            sentenceUpperBound: 15,
            units: unit,
        });
        setOutput(text);
    };

    // Initial generation
    useState(() => {
        generate();
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Lorem Ipsum Generator</h1>
            </header>

            {/* AI Assist Section */}
            <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(147, 51, 234, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(147, 51, 234, 0.2)'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe the topic (e.g., 'generate 3 paragraphs about cybersecurity', '5 sentences about a fictional city')"
                        style={{
                            flex: 1,
                            padding: '0.6rem 1rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
                            fontSize: '0.9rem'
                        }}
                    />
                    <AiAssistButton
                        type="lorem"
                        payload={{ description: aiPrompt, count, unit }}
                        onResult={handleAiResult}
                        disabled={!aiPrompt.trim()}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.controls}>
                    <div className={styles.group}>
                        <label>Count</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.group}>
                        <label>Unit</label>
                        <div className={styles.radioGroup}>
                            <button
                                className={`${styles.radioBtn} ${unit === 'paragraphs' ? styles.active : ''}`}
                                onClick={() => setUnit('paragraphs')}
                            >
                                ¶ Paragraphs
                            </button>
                            <button
                                className={`${styles.radioBtn} ${unit === 'sentences' ? styles.active : ''}`}
                                onClick={() => setUnit('sentences')}
                            >
                                . Sentences
                            </button>
                            <button
                                className={`${styles.radioBtn} ${unit === 'words' ? styles.active : ''}`}
                                onClick={() => setUnit('words')}
                            >
                                Abc Words
                            </button>
                        </div>
                    </div>

                    <button onClick={generate} className={styles.generateBtn}>
                        <RefreshCw size={18} /> Generate Text
                    </button>
                </div>

                <div className={styles.outputArea}>
                    <div className={styles.outputHeader}>
                        <span>Generated Text</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(output)}
                            className={styles.copyBtn}
                        >
                            <Copy size={16} /> Copy
                        </button>
                    </div>
                    <textarea
                        readOnly
                        value={output}
                        className={styles.textarea}
                    />
                </div>
            </div>
        </div>
    );
}
