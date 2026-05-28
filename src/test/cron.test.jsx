import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CronTool from '../app/tools/cron/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/AiAssistBar', () => ({
    default: () => null,
}));

describe('CronTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<CronTool />);
        expect(screen.getByText('Cron Expression Parser')).toBeInTheDocument();
    });

    it('shows description for default expression', () => {
        render(<CronTool />);
        expect(screen.getByDisplayValue('*/5 * * * *')).toBeInTheDocument();
        const descriptions = screen.getAllByText(/every 5 minutes/i);
        expect(descriptions.length).toBeGreaterThanOrEqual(1);
    });

    it('updates description when expression changes', () => {
        render(<CronTool />);
        const input = screen.getByDisplayValue('*/5 * * * *');
        fireEvent.change(input, { target: { value: '0 * * * *' } });
        const descriptions = screen.getAllByText(/every hour/i);
        expect(descriptions.length).toBeGreaterThanOrEqual(1);
    });

    it('shows next 5 runs', () => {
        render(<CronTool />);
        expect(screen.getByText('Next 5 Runs')).toBeInTheDocument();
    });

    it('shows placeholder for invalid expression', () => {
        render(<CronTool />);
        const input = screen.getByDisplayValue('*/5 * * * *');
        fireEvent.change(input, { target: { value: 'not-a-cron' } });
        expect(screen.getByText('Enter a cron expression')).toBeInTheDocument();
    });

    it('applies preset on click', () => {
        render(<CronTool />);
        fireEvent.click(screen.getByText('Every hour'));
        expect(screen.getByDisplayValue('0 * * * *')).toBeInTheDocument();
    });
});
