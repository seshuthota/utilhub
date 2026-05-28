import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MermaidTool from '../app/tools/mermaid/page';

vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
    },
}));

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue);
        return [val, setVal];
    },
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

vi.mock('@/components/common/AiAssistBar', () => ({
    default: () => null,
}));

vi.mock('@/components/common/AiDisclaimer', () => ({
    default: () => null,
}));

vi.mock('@/components/common/ActionToolbar', () => ({
    default: () => null,
}));

describe('MermaidTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<MermaidTool />);
        expect(screen.getByText('Mermaid Chart')).toBeInTheDocument();
    });

    it('shows action buttons', () => {
        render(<MermaidTool />);
        expect(screen.getByText('Download')).toBeInTheDocument();
        expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('clears editor on clear', () => {
        render(<MermaidTool />);
        fireEvent.click(screen.getByText('Clear'));
        const editor = screen.getAllByTestId('code-editor')[0];
        expect(editor).toHaveValue('');
    });
});
