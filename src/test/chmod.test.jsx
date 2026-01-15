import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChmodCalculator from '../app/tools/chmod/page';

describe('ChmodCalculator', () => {
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
});
