import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import YamlValidator from '../app/tools/yaml-validator/page';

// Mock matchMedia
window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

// Mock URL state
vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, def) => {
        const React = require('react');
        return React.useState(def);
    }
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

const VALID_K8S = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

const INVALID_K8S = `apiVersion: v1
kind: Pod
metadata:
  namespace: missing-name`;

describe('YAML Validator', () => {
    it('renders correctly', () => {
        render(<YamlValidator />);
        expect(screen.getByText('YAML & Kubernetes Validator')).toBeDefined();
    });

    it('validates correct YAML and K8s', async () => {
        render(<YamlValidator />);
        const input = screen.getByPlaceholderText('Paste YAML here...');
        fireEvent.change(input, { target: { value: VALID_K8S } });

        await waitFor(() => {
            expect(screen.getByText('Valid YAML Syntax')).toBeDefined();
            expect(screen.getByText('✓ Valid Basic Kubernetes Resource')).toBeDefined();
        });
    });

    it('detects invalid K8s schema', async () => {
        render(<YamlValidator />);
        const input = screen.getByPlaceholderText('Paste YAML here...');
        fireEvent.change(input, { target: { value: INVALID_K8S } });

        await waitFor(() => {
            expect(screen.getByText(/Found \d+ Issue/)).toBeDefined();
            expect(screen.getByText(/K8s Schema:/)).toBeDefined();
        });
    });
});
