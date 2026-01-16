import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DockerConverter from '../app/tools/docker/page';

// Mock composerize
vi.mock('composerize', () => ({
    default: vi.fn((cmd) => {
        if (cmd.includes('invalid')) throw new Error('Invalid command');
        return 'version: "3"\nservices:\n  app:\n    image: test';
    })
}));

// Mock URL state
vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, def) => {
        const React = require('react');
        return React.useState(def);
    }
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '',
}));

// Mock CodeEditor
vi.mock('@/components/common/CodeEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

describe('Docker Converter', () => {
    it('renders correctly', () => {
        render(<DockerConverter />);
        expect(screen.getByText('Docker Run to Compose')).toBeDefined();
    });

    it('converts valid docker run command', async () => {
        render(<DockerConverter />);
        const input = screen.getByPlaceholderText(/Paste your docker run command/);
        fireEvent.change(input, { target: { value: 'docker run test' } });

        await waitFor(() => {
            expect(screen.getByDisplayValue(/version: "3"/)).toBeDefined();
        });
    });

    it('displays error for invalid command', async () => {
        render(<DockerConverter />);
        const input = screen.getByPlaceholderText(/Paste your docker run command/);
        fireEvent.change(input, { target: { value: 'docker run invalid' } });

        await waitFor(() => {
            expect(screen.getByText(/Error:/)).toBeDefined();
        });
    });
});
