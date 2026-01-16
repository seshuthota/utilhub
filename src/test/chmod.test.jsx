import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChmodCalculator from '../app/tools/chmod/page';

// Mock clipboard
const writeTextMock = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: writeTextMock,
    },
});

describe('ChmodCalculator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ChmodCalculator />);
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('Group')).toBeInTheDocument();
        expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('updates checkboxes when octal input changes', () => {
        const { container } = render(<ChmodCalculator />);
        const octalInput = screen.getByDisplayValue('755'); // Default

        fireEvent.change(octalInput, { target: { value: '777' } });

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        // All 9 checkboxes should be checked for 777
        checkboxes.forEach(cb => expect(cb).toBeChecked());
    });

    it('updates octal value when checkboxes change', () => {
        const { container } = render(<ChmodCalculator />);
        // Default 755. Group Write (index 4) is unchecked.
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const groupWrite = checkboxes[4]; // Owner R,W,X (0,1,2), Group R(3), W(4)

        fireEvent.click(groupWrite); // Enable Group Write -> 775

        expect(screen.getByDisplayValue('775')).toBeInTheDocument();
        expect(screen.getByDisplayValue('-rwxrwxr-x')).toBeInTheDocument();
    });

    it('updates checkboxes and octal when symbolic input changes', () => {
        const { container } = render(<ChmodCalculator />);
        const symbolicInput = screen.getByDisplayValue('-rwxr-xr-x');

        fireEvent.change(symbolicInput, { target: { value: '-rwxrwxrwx' } }); // 777

        expect(screen.getByDisplayValue('777')).toBeInTheDocument();
        
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => expect(cb).toBeChecked());
    });

    it('ignores invalid symbolic input', () => {
        render(<ChmodCalculator />);
        const symbolicInput = screen.getByDisplayValue('-rwxr-xr-x');

        fireEvent.change(symbolicInput, { target: { value: 'invalid-string' } });

        // Should not update octal (remain 755)
        expect(screen.getByDisplayValue('755')).toBeInTheDocument();
    });

    it('copies to clipboard when copy button clicked', () => {
        render(<ChmodCalculator />);
        
        // There are two copy buttons. Let's find by title.
        const copyButtons = screen.getAllByTitle('Copy chmod command');
        
        fireEvent.click(copyButtons[0]); // Octal copy
        expect(writeTextMock).toHaveBeenCalledWith('chmod 755 filename');
        
        fireEvent.click(copyButtons[1]); // Symbolic copy
        expect(writeTextMock).toHaveBeenCalledWith('chmod -rwxr-xr-x filename');
    });
});
