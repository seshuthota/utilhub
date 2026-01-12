'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';
import { CheckCircle, XCircle, AlertTriangle, Wand2 } from 'lucide-react';
import styles from './page.module.css';

// Basic CSS linting rules
const lintCSS = (css) => {
    const issues = [];
    const lines = css.split('\n');

    lines.forEach((line, i) => {
        const lineNum = i + 1;

        // Check for !important
        if (line.includes('!important')) {
            issues.push({ line: lineNum, type: 'warning', message: 'Avoid using !important' });
        }

        // Check for inline styles hint
        if (line.includes('style=')) {
            issues.push({ line: lineNum, type: 'warning', message: 'Possible inline style detected' });
        }

        // Check for vendor prefixes without standard
        if (line.match(/-webkit-|-moz-|-ms-/) && !line.includes('/*')) {
            issues.push({ line: lineNum, type: 'info', message: 'Vendor prefix detected - consider using autoprefixer' });
        }

        // Check for px on 0 values
        if (line.match(/:\s*0px/)) {
            issues.push({ line: lineNum, type: 'info', message: 'Remove unit from zero value (0px → 0)' });
        }

        // Check for missing semicolons (basic)
        if (line.match(/:\s*[^;{}\s]+\s*$/) && !line.includes('{') && !line.includes('}') && line.trim()) {
            issues.push({ line: lineNum, type: 'error', message: 'Possible missing semicolon' });
        }
    });

    // Check for empty rulesets
    if (css.match(/{\s*}/)) {
        issues.push({ line: 0, type: 'warning', message: 'Empty ruleset detected' });
    }

    return issues;
};

export default function CssLintTool() {
    const [css, setCss] = useState(`.container {
  margin: 0px;
  padding: 20px;
}

.button {
  color: red !important;
  -webkit-transform: rotate(45deg);
}

.empty {}`);

    const issues = lintCSS(css);
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>CSS Linter</h1>
                <div className={styles.stats}>
                    <span className={styles.errors}><XCircle size={14} /> {errorCount} errors</span>
                    <span className={styles.warnings}><AlertTriangle size={14} /> {warningCount} warnings</span>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.editorPane}>
                    <div className={styles.paneHeader}>CSS Input</div>
                    <div className={styles.editor}>
                        <Editor
                            value={css}
                            onValueChange={setCss}
                            highlight={code => Prism.highlight(code, Prism.languages.css, 'css')}
                            padding={20}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 14,
                                backgroundColor: 'transparent',
                                minHeight: '100%',
                            }}
                        />
                    </div>
                </div>

                <div className={styles.issuesPane}>
                    <div className={styles.paneHeader}>Issues ({issues.length})</div>
                    <div className={styles.issueList}>
                        {issues.length === 0 ? (
                            <div className={styles.noIssues}>
                                <CheckCircle size={24} /> No issues found!
                            </div>
                        ) : (
                            issues.map((issue, i) => (
                                <div key={i} className={`${styles.issue} ${styles[issue.type]}`}>
                                    {issue.type === 'error' && <XCircle size={14} />}
                                    {issue.type === 'warning' && <AlertTriangle size={14} />}
                                    {issue.type === 'info' && <Wand2 size={14} />}
                                    <span className={styles.lineNum}>Line {issue.line || '?'}:</span>
                                    {issue.message}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
