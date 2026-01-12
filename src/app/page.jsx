'use client';

import ToolCard from '@/components/common/ToolCard';
import { FileText, Braces, GitGraph, FileDiff, Database, Crop, QrCode, FileCode, refreshCcw, Image as ImageIcon, RefreshCcw, Clock, Shield, ShieldCheck, Type, Link as LinkIcon, Search } from 'lucide-react';
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
    id: 'xml',
    title: 'XML Formatter',
    description: 'Format, minify, and validate XML data.',
    icon: FileCode, // Import this
    href: '/tools/xml'
  },
  {
    id: 'image',
    title: 'Image Resizer',
    description: 'Resize, compress, and convert images locally.',
    icon: ImageIcon, // Import this
    href: '/tools/image'
  },
  {
    id: 'base64',
    title: 'Base64 Converter',
    description: 'Encode and decode text or data to Base64.',
    icon: RefreshCcw, // Import this
    href: '/tools/base64'
  },
  {
    id: 'timestamp',
    title: 'Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates.',
    icon: Clock, // Import
    href: '/tools/timestamp'
  },
  {
    id: 'hash',
    title: 'Hash Generator',
    description: 'Calculate MD5, SHA-1, SHA-256 hashes.',
    icon: Shield, // Import
    href: '/tools/hash'
  },
  {
    id: 'password',
    title: 'Password Audit',
    description: 'Check password strength and crack times.',
    icon: ShieldCheck, // Import
    href: '/tools/password'
  },
  {
    id: 'lorem',
    title: 'Lorem Ipsum',
    description: 'Generate dummy text placeholders.',
    icon: Type, // Import
    href: '/tools/lorem'
  },
  {
    id: 'yaml',
    title: 'YAML Converter',
    description: 'Convert between YAML and JSON.',
    icon: FileText, // Reuse FileText or import new
    href: '/tools/yaml'
  },
  {
    id: 'csv',
    title: 'CSV Viewer',
    description: 'Parse CSV to table and export JSON.',
    icon: Braces, // Placeholder
    href: '/tools/csv'
  },
  {
    id: 'url',
    title: 'URL Encoder',
    description: 'Encode and decode URL components.',
    icon: LinkIcon, // Import
    href: '/tools/url'
  },
  {
    id: 'regex',
    title: 'Regex Tester',
    description: 'Test regular expressions against text.',
    icon: Search, // Import
    href: '/tools/regex'
  },
  {
    id: 'jwt',
    title: 'JWT Decoder',
    description: 'Decode and inspect JSON Web Tokens.',
    icon: ShieldCheck,
    href: '/tools/jwt'
  },
  {
    id: 'cron',
    title: 'Cron Parser',
    description: 'Visualize cron schedules and see next run times.',
    icon: Clock,
    href: '/tools/cron'
  },
  {
    id: 'json-schema',
    title: 'JSON Schema',
    description: 'Validate JSON data against schemas.',
    icon: Braces,
    href: '/tools/json-schema'
  },
  {
    id: 'units',
    title: 'Unit Converter',
    description: 'Convert bytes, CSS units, and time.',
    icon: RefreshCcw,
    href: '/tools/units'
  },
  {
    id: 'color',
    title: 'Color Picker',
    description: 'Pick colors and convert between HEX, RGB, HSL.',
    icon: Braces,
    href: '/tools/color'
  },
  {
    id: 'beautify',
    title: 'Code Beautifier',
    description: 'Beautify or minify HTML, CSS, and JavaScript.',
    icon: FileCode,
    href: '/tools/beautify'
  },
  {
    id: 'validate',
    title: 'Email/URL Validator',
    description: 'Validate email addresses and URLs.',
    icon: ShieldCheck,
    href: '/tools/validate'
  },
  {
    id: 'api-tester',
    title: 'API Tester',
    description: 'Send HTTP requests and view responses.',
    icon: LinkIcon,
    href: '/tools/api-tester'
  },
  {
    id: 'css-lint',
    title: 'CSS Linter',
    description: 'Check CSS for errors and best practices.',
    icon: FileCode,
    href: '/tools/css-lint'
  },
  {
    id: 'html-lint',
    title: 'HTML Validator',
    description: 'Validate HTML and check accessibility.',
    icon: FileText,
    href: '/tools/html-lint'
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
