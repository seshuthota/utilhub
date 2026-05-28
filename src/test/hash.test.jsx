import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HashTool from '../app/tools/hash/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('hash-wasm', () => ({
    md5: vi.fn().mockResolvedValue('5d41402abc4b2a76b9719d911017c592'),
    sha1: vi.fn().mockResolvedValue('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'),
    sha256: vi.fn().mockResolvedValue('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'),
    sha512: vi.fn().mockResolvedValue('9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043'),
    sha3: vi.fn().mockResolvedValue('d7e2724e7ab0bc20b0e3f5e7b8e1e0b9f8c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5'),
}));

describe('HashTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<HashTool />);
        expect(screen.getByText('Hash Generator')).toBeInTheDocument();
    });

    it('shows compute button and empty state', () => {
        render(<HashTool />);
        expect(screen.getByText('Compute Hashes')).toBeInTheDocument();
        expect(screen.getByText(/Click "Compute Hashes" to generate/)).toBeInTheDocument();
    });
});
