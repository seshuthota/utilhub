'use client';

import { useEffect, useMemo, useRef } from 'react';
import styles from './SafeSvgPreview.module.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

export type SvgPreviewBackground = 'checkerboard' | 'light' | 'none';

interface SafeSvgPreviewProps {
    svg: string;
    alt?: string;
    background?: SvgPreviewBackground;
    className?: string;
}

/**
 * Makes untrusted SVG markup displayable as a standalone image document:
 * standalone SVG needs an xmlns, and a percentage/missing width (mermaid emits
 * width="100%") gives the <img> no intrinsic size, so fall back to the viewBox.
 */
export function prepareSvgForImage(svg: string): string {
    let markup = svg.trim();
    if (!markup) return '';

    // Insert the SVG namespace if the root tag lacks one (e.g. "Remove XMLNS").
    markup = markup.replace(/<svg\b([^>]*)>/i, (tag, attrs: string) =>
        /\sxmlns\s*=/.test(attrs) ? tag : `<svg xmlns="${SVG_NS}"${attrs}>`
    );

    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') return markup;

    try {
        const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
        const root = doc.documentElement;
        if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) {
            return markup;
        }

        const viewBox = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
        const hasViewBox = viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0;
        const isRelative = (value: string | null) => !value || value.trim().endsWith('%');

        if (hasViewBox && isRelative(root.getAttribute('width')) && isRelative(root.getAttribute('height'))) {
            root.setAttribute('width', String(viewBox[2]));
            root.setAttribute('height', String(viewBox[3]));
        }

        return new XMLSerializer().serializeToString(root);
    } catch {
        return markup;
    }
}

/**
 * Renders SVG markup through an <img>. Browsers never run scripts, event
 * handlers or javascript: links inside an image, and don't fetch external
 * resources from it, so this is safe for SVG from shareable URLs or AI output.
 */
export default function SafeSvgPreview({
    svg,
    alt = 'SVG preview',
    background = 'checkerboard',
    className,
}: SafeSvgPreviewProps) {
    const markup = useMemo(() => prepareSvgForImage(svg), [svg]);
    const imgRef = useRef<HTMLImageElement>(null);

    // The URL is assigned imperatively so the effect can own the object URL's lifetime
    useEffect(() => {
        const img = imgRef.current;
        if (!img || !markup) return;

        if (typeof URL.createObjectURL !== 'function') {
            img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
            return;
        }

        const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
        img.src = url;
        return () => URL.revokeObjectURL(url);
    }, [markup]);

    if (!markup) return null;

    return (
        <div className={`${styles.frame} ${styles[background] || ''} ${className || ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} className={styles.image} alt={alt} draggable={false} />
        </div>
    );
}
