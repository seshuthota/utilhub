'use client';

import { useState, useEffect } from 'react';
import { loremIpsum } from 'lorem-ipsum';
import { Copy, RefreshCw } from 'lucide-react';
import AiAssistBar from '@/components/common/AiAssistBar';
import styles from './page.module.css';

type LoremUnit = 'paragraphs' | 'sentences' | 'words';

export default function LoremTool() {
    const [count, setCount] = useState(3);
    const [unit, setUnit] = useState<LoremUnit>('paragraphs');
    const [output, setOutput] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');

    const handleAiResult = (response: string) => {
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
    useEffect(() => {
        generate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Lorem Ipsum Generator</h1>
            </header>

            {/* AI Assist Section */}
            <AiAssistBar
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
                type="lorem"
                payload={{ count, unit }}
                onResult={handleAiResult}
                placeholder="Describe the topic (e.g., 'generate 3 paragraphs about cybersecurity', '5 sentences about a fictional city')"
            />

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
