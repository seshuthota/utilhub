export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
    const blob = typeof content === 'string'
        ? new Blob([content], { type: mimeType || 'application/octet-stream' })
        : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
