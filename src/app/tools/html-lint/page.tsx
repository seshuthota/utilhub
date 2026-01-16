'use client';

import { useState } from 'react';
// @ts-ignore
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import { CheckCircle, XCircle, AlertTriangle, Accessibility } from 'lucide-react';
import styles from './page.module.css';

interface Issue {
    type: 'error' | 'warning' | 'info';
    message: string;
}

// Basic HTML linting rules
const lintHTML = (html: string): Issue[] => {
    const issues: Issue[] = [];

    // Check for missing doctype
    if (!html.trim().toLowerCase().startsWith('<!doctype')) {
        issues.push({ type: 'warning', message: 'Missing DOCTYPE declaration' });
    }

    // Check for missing lang attribute
    if (html.includes('<html') && !html.match(/<html[^>]*lang=/i)) {
        issues.push({ type: 'warning', message: 'Missing lang attribute on <html>' });
    }

    // Check for images without alt
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    imgMatches.forEach(img => {
        if (!img.includes('alt=')) {
            issues.push({ type: 'error', message: `Image missing alt attribute: ${img.substring(0, 50)}...` });
        }
    });

    // Check for deprecated tags
    const deprecated = ['<font', '<center', '<marquee', '<blink'];
    deprecated.forEach(tag => {
        if (html.toLowerCase().includes(tag)) {
            issues.push({ type: 'warning', message: `Deprecated tag found: ${tag}>` });
        }
    });

    // Check for inline styles
    if (html.includes('style=')) {
        issues.push({ type: 'info', message: 'Inline styles detected - consider using CSS classes' });
    }

    // Check for missing title
    if (!html.includes('<title>') && html.includes('<head')) {
        issues.push({ type: 'warning', message: 'Missing <title> tag in <head>' });
    }

    // Check for form inputs without labels
    const inputMatches = html.match(/<input[^>]*>/gi) || [];
    inputMatches.forEach(input => {
        if (!input.includes('aria-label') && !input.includes('id=')) {
            issues.push({ type: 'info', message: 'Input may need a label or aria-label for accessibility' });
        }
    });

    return issues;
};

export default function HtmlLintTool() {
    const [html, setHtml] = useState(`<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <center>Old center tag</center>
  <img src="photo.jpg">
  <div style="color: red;">Inline styles</div>
  <input type="text">
</body>
</html>`);

    const issues = lintHTML(html);
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>HTML Validator</h1>
                <div className={styles.stats}>
                    <span className={styles.errors}><XCircle size={14} /> {errorCount} errors</span>
                    <span className={styles.warnings}><AlertTriangle size={14} /> {warningCount} warnings</span>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.editorPane}>
                    <div className={styles.paneHeader}>HTML Input</div>
                    <div className={styles.editor}>
                        <Editor
                            value={html}
                            onValueChange={setHtml}
                            highlight={(code: string) => Prism.highlight(code, Prism.languages.markup, 'markup')}
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
                    <div className={styles.paneHeader}>
                        <span>Issues ({issues.length})</span>
                        <Accessibility size={16} />
                    </div>
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
                                    {issue.type === 'info' && <Accessibility size={14} />}
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
