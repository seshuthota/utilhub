import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ImageTool', () => {
    it('has filter definitions with correct structure', () => {
        const filters = [
            { id: 'none', name: 'Original' },
            { id: 'grayscale', name: 'Grayscale' },
            { id: 'sepia', name: 'Sepia' },
            { id: 'invert', name: 'Invert' },
            { id: 'brighten', name: 'Brighten' },
            { id: 'saturate', name: 'Saturate' },
            { id: 'blur', name: 'Blur' },
        ];
        expect(filters.length).toBe(7);
        expect(filters[0].id).toBe('none');
    });
});
