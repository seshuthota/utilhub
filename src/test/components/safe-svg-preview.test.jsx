import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafeSvgPreview, { prepareSvgForImage } from '@/components/common/SafeSvgPreview';

describe('prepareSvgForImage', () => {
    it('adds a missing SVG namespace', () => {
        expect(prepareSvgForImage('<svg viewBox="0 0 4 2"></svg>')).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('sizes percentage-width SVGs from the viewBox', () => {
        const out = prepareSvgForImage('<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 120 40"></svg>');
        expect(out).toContain('width="120"');
        expect(out).toContain('height="40"');
    });

    it('keeps explicit dimensions', () => {
        const out = prepareSvgForImage('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" viewBox="0 0 120 40"></svg>');
        expect(out).toContain('width="10"');
        expect(out).toContain('height="20"');
    });
});

describe('SafeSvgPreview', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders nothing for empty markup', () => {
        const { container } = render(<SafeSvgPreview svg="" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders an <img> and no inline SVG', () => {
        const { container } = render(
            <SafeSvgPreview svg={'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>'} />
        );
        expect(screen.getByAltText('SVG preview').tagName).toBe('IMG');
        expect(container.querySelector('svg, script')).toBeNull();
    });

    it('uses an object URL when available and revokes it on change/unmount', () => {
        const create = vi.fn()
            .mockReturnValueOnce('blob:one')
            .mockReturnValueOnce('blob:two');
        const revoke = vi.fn();
        const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
        URL.createObjectURL = create;
        URL.revokeObjectURL = revoke;

        try {
            const { rerender, unmount } = render(<SafeSvgPreview svg="<svg><rect/></svg>" />);
            expect(screen.getByAltText('SVG preview')).toHaveAttribute('src', 'blob:one');

            rerender(<SafeSvgPreview svg="<svg><circle/></svg>" />);
            expect(revoke).toHaveBeenCalledWith('blob:one');
            expect(screen.getByAltText('SVG preview')).toHaveAttribute('src', 'blob:two');

            unmount();
            expect(revoke).toHaveBeenCalledWith('blob:two');
        } finally {
            URL.createObjectURL = original.create;
            URL.revokeObjectURL = original.revoke;
        }
    });
});
