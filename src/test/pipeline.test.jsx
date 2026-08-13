import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PipelineTool from '../app/tools/pipeline/page';

vi.mock('@/hooks/usePipeline', () => ({
    usePipeline: () => ({
        pipeline: { name: 'Untitled', description: '', steps: [] },
        addStep: vi.fn(),
        removeStep: vi.fn(),
        reorderSteps: vi.fn(),
        updateStep: vi.fn(),
        updatePipeline: vi.fn(),
        save: vi.fn(),
        isDirty: false,
    }),
    usePipelineExecution: () => ({
        execute: vi.fn(),
        isExecuting: false,
        currentStep: null,
        results: [],
        error: null,
        finalOutput: null,
    }),
    usePipelineStorage: () => ({
        pipelines: [],
        save: vi.fn(),
        remove: vi.fn(),
        getShareUrl: vi.fn().mockReturnValue('https://example.com/tools/pipeline?p=abc'),
        loadAll: vi.fn(),
    }),
    useCompatibleTools: () => [],
    useUrlPipeline: () => ({ pipeline: null, error: null }),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/utils/pipeline', () => ({
    getToolAdapter: vi.fn().mockReturnValue(null),
    getExamplePipelines: vi.fn().mockReturnValue([]),
}));

vi.mock('@/config/tools', () => ({
    tools: [],
}));

describe('PipelineTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<PipelineTool />);
        expect(screen.getByText('Pipeline Builder')).toBeInTheDocument();
    });
});
