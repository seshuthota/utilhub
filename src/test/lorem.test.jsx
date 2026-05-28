import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoremTool from '../app/tools/lorem/page';

vi.mock('@/components/common/AiAssistBar', () => ({
    default: () => null,
}));

describe('LoremTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<LoremTool />);
        expect(screen.getByText('Lorem Ipsum Generator')).toBeInTheDocument();
    });

    it('generates initial lorem ipsum text', () => {
        render(<LoremTool />);
        const textarea = screen.getByRole('textbox');
        expect(textarea.textContent.length).toBeGreaterThan(0);
    });

    it('changes count value', () => {
        render(<LoremTool />);
        const countInput = screen.getByDisplayValue('3');
        fireEvent.change(countInput, { target: { value: '5' } });
        expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('generates new text on button click', () => {
        render(<LoremTool />);
        fireEvent.click(screen.getByText('Generate Text'));
        const textarea = screen.getByRole('textbox');
        expect(textarea.textContent.length).toBeGreaterThan(0);
    });

    it('switches to sentences unit', () => {
        render(<LoremTool />);
        fireEvent.click(screen.getByText('. Sentences'));
    });
});
