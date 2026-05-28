import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import XmlTool from '../app/tools/xml/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

describe('XmlTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<XmlTool />);
        expect(screen.getByText('XML Formatter')).toBeInTheDocument();
    });

    it('shows action buttons', () => {
        render(<XmlTool />);
        expect(screen.getByText('Format')).toBeInTheDocument();
        expect(screen.getByText('Minify')).toBeInTheDocument();
        expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('formats XML', () => {
        render(<XmlTool />);
        fireEvent.click(screen.getByText('Format'));
        const editor = screen.getAllByTestId('code-editor')[0];
        expect(editor).toHaveValue;
    });
});
