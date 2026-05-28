import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PipelineTool from '../app/tools/pipeline/page';

vi.mock('@/hooks/usePipeline', () => ({
    usePipeline: () => ({
        pipeline: { steps: [] },
        addStep: vi.fn(),
        removeStep: vi.fn(),
        reorderSteps: vi.fn(),
        updateStep: vi.fn(),
    }),
    usePipelineExecution: () => ({
        execute: vi.fn(),
        isExecuting: false,
        currentStep: null,
        results: [],
    }),
    usePipelineStorage: () => ({
        savePipeline: vi.fn(),
        loadPipeline: vi.fn(),
        listPipelines: vi.fn().mockReturnValue([]),
    }),
    useCompatibleTools: () => [],
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
