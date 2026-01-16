
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AiDisclaimer, { hasAcceptedAiDisclaimer, resetAiDisclaimer } from '@/components/common/AiDisclaimer';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AiDisclaimer Component', () => {
    const defaultProps = {
        isOpen: true,
        onAccept: vi.fn(),
        onCancel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        document.body.style.overflow = '';
    });

    it('renders nothing when isOpen is false', () => {
        render(<AiDisclaimer {...defaultProps} isOpen={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe('');
    });

    it('renders dialog when isOpen is true', () => {
        render(<AiDisclaimer {...defaultProps} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/AI Data Notice/i)).toBeInTheDocument();
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('calls onCancel when Cancel button is clicked', () => {
        render(<AiDisclaimer {...defaultProps} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when Close icon is clicked', () => {
        render(<AiDisclaimer {...defaultProps} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when overlay is clicked', () => {
        render(<AiDisclaimer {...defaultProps} />);
        fireEvent.click(screen.getByRole('dialog'));
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onAccept when Proceed button is clicked', () => {
        render(<AiDisclaimer {...defaultProps} />);
        fireEvent.click(screen.getByText('I Understand, Proceed'));
        expect(defaultProps.onAccept).toHaveBeenCalled();
        expect(localStorageMock.setItem).not.toHaveBeenCalled(); // Checkbox not checked
    });

    it('saves preference to localStorage when checkbox is checked', () => {
        render(<AiDisclaimer {...defaultProps} />);
        
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        
        fireEvent.click(screen.getByText('I Understand, Proceed'));
        
        expect(defaultProps.onAccept).toHaveBeenCalled();
        expect(localStorageMock.setItem).toHaveBeenCalledWith('utilhub_ai_disclaimer_accepted', 'true');
    });

    it('closes on Escape key', () => {
        render(<AiDisclaimer {...defaultProps} />);
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });
});

describe('AiDisclaimer Utilities', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it('hasAcceptedAiDisclaimer returns true if stored', () => {
        localStorageMock.getItem.mockReturnValue('true');
        expect(hasAcceptedAiDisclaimer()).toBe(true);
    });

    it('hasAcceptedAiDisclaimer returns false if not stored', () => {
        localStorageMock.getItem.mockReturnValue(null);
        expect(hasAcceptedAiDisclaimer()).toBe(false);
    });

    it('resetAiDisclaimer removes key', () => {
        resetAiDisclaimer();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('utilhub_ai_disclaimer_accepted');
    });
});
