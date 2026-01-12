'use client';

import ToolCard from '@/components/common/ToolCard';
import { FileText, Braces, GitGraph, FileDiff, Database, Crop, QrCode } from 'lucide-react';
import styles from './page.module.css';

const tools = [
  {
    id: 'markdown',
    title: 'Markdown Viewer',
    description: 'Start writing in markdown and see the result in real-time.',
    icon: FileText,
    href: '/tools/markdown'
  },
  {
    id: 'json',
    title: 'JSON Formatter',
    description: 'Format, validate, and minify your JSON data instantly.',
    icon: Braces,
    href: '/tools/json'
  },
  {
    id: 'mermaid',
    title: 'Mermaid Chart',
    description: 'Generate flowcharts and diagrams from text using Mermaid.js.',
    icon: GitGraph,
    href: '/tools/mermaid'
  },
  {
    id: 'diff',
    title: 'Diff Checker',
    description: 'Compare text files side-by-side to spot differences.',
    icon: FileDiff,
    href: '/tools/diff'
  },
  {
    id: 'sql',
    title: 'SQL Formatter',
    description: 'Beautify messy SQL queries for better readability.',
    icon: Database,
    href: '/tools/sql'
  },
  {
    id: 'qrcode',
    title: 'QR Code Tool',
    description: 'Generate QR codes from text or scan them using your camera.',
    icon: QrCode,
    href: '/tools/qrcode'
  }
];

export default function Home() {
  return (
    <div>
      <h1 className={styles.header}>Dashboard</h1>
      <div className={styles.grid}>
        {tools.map(tool => (
          <ToolCard key={tool.id} {...tool} />
        ))}
      </div>
    </div>
  )
}
