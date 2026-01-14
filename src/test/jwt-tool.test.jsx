
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JwtTool from '../app/tools/jwt/page';
import { decodeJwt, getExpirationStatus } from '../utils/jwt';

// Mock clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

// Mock Toast
vi.mock('@/components/Toast', () => ({
    useToast: () => ({
        showToast: vi.fn(),
    }),
}));

describe('JWT Utilities', () => {
    it('decodes a valid JWT successfully', () => {
        // Simple token: header.payload.signature
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const result = decodeJwt(token);

        expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
        expect(result.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
        expect(result.error).toBeNull();
    });

    it('handles invalid token structure', () => {
        const result = decodeJwt('invalid-token');
        expect(result.error).toContain('Invalid token');
        expect(result.payload).toBeNull();
    });

    it('calculates expiration status correctly', () => {
        const now = Date.now();
        const futureExp = Math.floor((now + 3600000) / 1000); // 1 hour from now
        const pastExp = Math.floor((now - 3600000) / 1000);   // 1 hour ago

        const futureStatus = getExpirationStatus(futureExp);
        expect(futureStatus.isExpired).toBe(false);
        expect(futureStatus.text).toContain('Expires in');

        const pastStatus = getExpirationStatus(pastExp);
        expect(pastStatus.isExpired).toBe(true);
        expect(pastStatus.text).toContain('Expired');
    });
});
