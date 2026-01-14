
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegexTool from '../app/tools/regex/page';

// Mock useUrlState to behave like useState for testing
vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue);
        return [val, setVal];
    }
}));

// Mock Toast
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

describe('RegexTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with default values', () => {
        render(<RegexTool />);

        expect(screen.getByText('Regex Studio')).toBeInTheDocument();
        expect(screen.getByText('Match')).toBeInTheDocument();
        expect(screen.getByText('Replace')).toBeInTheDocument();
        // Check for default pattern parts in input
        expect(screen.getByDisplayValue(/A-Za-z0-9/)).toBeInTheDocument();
    });

    it('displays explanation for regex', () => {
        render(<RegexTool />);
        expect(screen.getByText('Explanation')).toBeInTheDocument();
        // Since default regex has ranges, check if "Set" label appears
        expect(screen.getAllByText('Set')[0]).toBeInTheDocument();
    });

    it('switches to replace mode', () => {
        render(<RegexTool />);

        const replaceTab = screen.getByText('Replace');
        fireEvent.click(replaceTab);

        expect(screen.getByPlaceholderText('Replacement text...')).toBeInTheDocument();
        expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('inserts token from cheatsheet', () => {
        render(<RegexTool />);

        const digitBtn = screen.getByText('Digit (0-9)');
        fireEvent.click(digitBtn);

        const input = screen.getByPlaceholderText('Regex Pattern');
        // Default pattern + \d
        expect(input.value).toContain('\\d');
    });

    it('highlights matches in text', () => {
        render(<RegexTool />);
        // Default text contains emails which match the default pattern
        const text = screen.getByText('support@utilhub.com');
        expect(text).toHaveClass(/highlight/);
    });
});
