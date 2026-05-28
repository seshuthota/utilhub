import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseConverterTool from '../app/tools/case-converter/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

describe('CaseConverterTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<CaseConverterTool />);
        expect(screen.getByText('Text Case Converter')).toBeInTheDocument();
    });

    it('shows default case conversions', () => {
        render(<CaseConverterTool />);
        expect(screen.getByText('camelCase')).toBeInTheDocument();
        expect(screen.getByText('PascalCase')).toBeInTheDocument();
        expect(screen.getByText('snake_case')).toBeInTheDocument();
        expect(screen.getByText('kebab-case')).toBeInTheDocument();
    });

    it('converts text to camelCase', () => {
        render(<CaseConverterTool />);
        const textarea = screen.getByPlaceholderText('Enter text to convert...');
        fireEvent.change(textarea, { target: { value: 'hello world' } });
        expect(screen.getByText('helloWorld')).toBeInTheDocument();
    });

    it('converts text to SCREAMING_SNAKE', () => {
        render(<CaseConverterTool />);
        const textarea = screen.getByPlaceholderText('Enter text to convert...');
        fireEvent.change(textarea, { target: { value: 'hello world' } });
        expect(screen.getByText('HELLO_WORLD')).toBeInTheDocument();
    });

    it('converts text to Title Case', () => {
        render(<CaseConverterTool />);
        const textarea = screen.getByPlaceholderText('Enter text to convert...');
        fireEvent.change(textarea, { target: { value: 'hello world' } });
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
});
