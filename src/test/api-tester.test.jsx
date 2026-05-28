import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApiTester from '../app/tools/api-tester/page';

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue || '');
        return [val, setVal];
    },
}));

vi.mock('@/hooks/useHotkeys', () => ({
    useHotkeys: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: () => null,
}));

vi.mock('./EnvironmentManager', () => ({
    default: () => null,
}));

vi.mock('@/components/common/HistorySidebar', () => ({
    default: () => null,
}));

vi.mock('@/hooks/useEnvironments', () => ({
    useEnvironments: () => ({
        environments: [],
        activeEnvId: null,
        setActiveEnvId: vi.fn(),
        addEnvironment: vi.fn(),
        updateEnvironment: vi.fn(),
        deleteEnvironment: vi.fn(),
        duplicateEnvironment: vi.fn(),
        getActiveEnvironment: vi.fn().mockReturnValue(null),
    }),
    substituteVariables: (text) => text,
}));

vi.mock('@/hooks/useHistory', () => ({
    useHistory: () => ({
        history: [],
        addToHistory: vi.fn(),
        clearHistory: vi.fn(),
        removeFromHistory: vi.fn(),
    }),
}));

vi.mock('@/utils/curl', () => ({
    parseCurl: vi.fn().mockReturnValue(null),
}));

describe('ApiTester', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ApiTester />);
        expect(screen.getByText(/API Tester/i)).toBeInTheDocument();
    });
});
