import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FaviconGenerator from '../app/tools/favicon/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('jszip', () => ({
    default: function() {
        return {
            file: vi.fn().mockReturnThis(),
            generateAsync: vi.fn().mockResolvedValue(new Blob()),
        };
    },
}));

describe('FaviconGenerator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<FaviconGenerator />);
        expect(screen.getByText('Favicon Generator')).toBeInTheDocument();
    });

    it('shows download button', () => {
        render(<FaviconGenerator />);
        expect(screen.getByText('Download All (ZIP)')).toBeInTheDocument();
    });
});
