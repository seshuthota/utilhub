import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    decodeJwt,
    verifyJwt,
    verifyJwtDetailed,
    signJwt,
    getExpirationStatus,
    getClaimTimeStatus,
    getClaimsTimeline,
    getJwtSecurityWarnings,
    formatBearerHeader,
    getIdentityClaims,
} from '@/utils/jwt';

// HS256 fixture (header/payload same as common jwt.io demo; signature for secret "secret" via Web Crypto)
const VALID_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o';
const SECRET = 'secret';

describe('decodeJwt', () => {
    it('decodes a valid token', () => {
        const { header, payload, signature, error } = decodeJwt(VALID_TOKEN);
        expect(error).toBeNull();
        expect(header.alg).toBe('HS256');
        expect(payload.sub).toBe('1234567890');
        expect(payload.name).toBe('John Doe');
        expect(signature).toBeTruthy();
    });

    it('returns error for bad structure', () => {
        const r = decodeJwt('not.a.jwt.extra');
        expect(r.error).toMatch(/3 parts/i);
    });

    it('handles empty input', () => {
        const r = decodeJwt('');
        expect(r.header).toBeNull();
        expect(r.error).toBeNull();
    });
});

describe('verifyJwt / verifyJwtDetailed', () => {
    it('verifies classic token with correct secret', async () => {
        expect(await verifyJwt(VALID_TOKEN, SECRET)).toBe(true);
        const detailed = await verifyJwtDetailed(VALID_TOKEN, SECRET);
        expect(detailed.valid).toBe(true);
        expect(detailed.status).toBe('valid');
    });

    it('rejects wrong secret', async () => {
        expect(await verifyJwt(VALID_TOKEN, 'wrong')).toBe(false);
        const detailed = await verifyJwtDetailed(VALID_TOKEN, 'wrong');
        expect(detailed.status).toBe('invalid');
    });

    it('reports no_secret when secret missing', async () => {
        const detailed = await verifyJwtDetailed(VALID_TOKEN, '');
        expect(detailed.status).toBe('no_secret');
        expect(detailed.valid).toBe(false);
    });

    it('reports unsigned for empty signature', async () => {
        const parts = VALID_TOKEN.split('.');
        const unsigned = `${parts[0]}.${parts[1]}.`;
        const detailed = await verifyJwtDetailed(unsigned, SECRET);
        expect(detailed.status).toBe('unsigned');
    });
});

describe('signJwt + verify roundtrip', () => {
    it('signs and verifies HS256', async () => {
        const token = await signJwt(
            { alg: 'HS256', typ: 'JWT' },
            { sub: 'user-1', iat: 1700000000 },
            'my-secret',
        );
        expect(token).toBeTruthy();
        expect(await verifyJwt(token, 'my-secret')).toBe(true);
        expect(await verifyJwt(token, 'other')).toBe(false);
    });
});

describe('claims & expiration', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('getExpirationStatus for future exp', () => {
        const now = 1_700_000_000_000;
        vi.setSystemTime(now);
        const exp = Math.floor(now / 1000) + 3600;
        const s = getExpirationStatus(exp);
        expect(s.isExpired).toBe(false);
        expect(s.text).toMatch(/Expires in/i);
    });

    it('getClaimTimeStatus for iat/nbf/exp', () => {
        const now = 1_700_000_000_000;
        const iat = getClaimTimeStatus('iat', Math.floor(now / 1000) - 60, now);
        expect(iat.relative).toMatch(/Issued/i);
        const nbf = getClaimTimeStatus('nbf', Math.floor(now / 1000) + 120, now);
        expect(nbf.alert).toBe(true);
        const exp = getClaimTimeStatus('exp', Math.floor(now / 1000) - 10, now);
        expect(exp.alert).toBe(true);
    });

    it('getClaimsTimeline collects present claims', () => {
        const list = getClaimsTimeline({ iat: 1516239022, exp: 9999999999 });
        expect(list.map((c) => c.claim)).toEqual(['iat', 'exp']);
    });
});

describe('warnings & helpers', () => {
    it('warns on alg none', () => {
        const w = getJwtSecurityWarnings({ alg: 'none' }, { sub: 'x' }, '');
        expect(w.some((x) => x.level === 'danger')).toBe(true);
    });

    it('warns on unsupported alg as info', () => {
        const w = getJwtSecurityWarnings({ alg: 'RS256' }, { sub: 'x' }, 'abc');
        expect(w.some((x) => /RS256/.test(x.message))).toBe(true);
    });

    it('formatBearerHeader', () => {
        expect(formatBearerHeader(' abc ')).toBe('Authorization: Bearer abc');
        expect(formatBearerHeader('')).toBe('');
    });

    it('getIdentityClaims', () => {
        const id = getIdentityClaims({ sub: '1', iss: 'auth', aud: ['a', 'b'], foo: 'z' });
        expect(id.map((i) => i.key)).toEqual(['sub', 'iss', 'aud']);
        expect(id.find((i) => i.key === 'aud').value).toBe('a, b');
    });
});
