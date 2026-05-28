import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JsonTool from '../app/tools/json/page';

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue || '{}');
        return [val, setVal];
    },
}));

vi.mock('@/hooks/useHotkeys', () => ({
    useHotkeys: vi.fn(),
}));

vi.mock('@/hooks/useHistory', () => ({
    useHistory: () => ({
        history: [],
        addToHistory: vi.fn(),
        clearHistory: vi.fn(),
        removeFromHistory: vi.fn(),
    }),
}));

vi.mock('@/hooks/useInputSize', () => ({
    useInputSize: () => ({
        setInput: vi.fn(),
        startProcessing: vi.fn(),
        finishProcessing: vi.fn(),
        isProcessing: false,
        status: 'idle',
    }),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/hooks/useWorker', () => ({
    useWorker: () => ({
        execute: vi.fn(),
        isReady: false,
        terminate: vi.fn(),
        clearQueue: vi.fn(),
    }),
}));

vi.mock('@/workers/json.worker.js?raw', () => ({
    default: '',
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

vi.mock('@/components/common/AiAssistBar', () => ({
    default: () => null,
}));

vi.mock('@/components/common/HistorySidebar', () => ({
    default: () => null,
}));

vi.mock('@/components/common/ShareButton', () => ({
    default: () => null,
}));

vi.mock('@/components/common/ActionToolbar', () => ({
    default: () => null,
}));

describe('JsonTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<JsonTool />);
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
    });

    it('shows format and minify buttons', () => {
        render(<JsonTool />);
        expect(screen.getByText('Format')).toBeInTheDocument();
        expect(screen.getByText('Minify')).toBeInTheDocument();
    });
});
