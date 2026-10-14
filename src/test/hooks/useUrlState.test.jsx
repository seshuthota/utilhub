import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlState } from '@/hooks/useUrlState';
import { setHandoff, takeHandoff } from '@/utils/handoff';

function goTo(url) {
    window.history.replaceState(null, '', url);
}

describe('useUrlState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sessionStorage.clear();
        goTo('/tools/json');
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps state in the URL fragment, never the query string', () => {
        const { result } = renderHook(() => useUrlState('code', ''));
        act(() => result.current[1]('{"a":1}'));
        expect(window.location.hash).toBe('');
        act(() => vi.advanceTimersByTime(300));
        expect(window.location.search).toBe('');
        expect(new URLSearchParams(window.location.hash.slice(1)).get('code')).toBe('{"a":1}');
    });

    it('loads from the fragment on mount', () => {
        goTo('/tools/json#code=%5B1%5D&view=graph');
        const { result } = renderHook(() => useUrlState('view', 'text'));
        expect(result.current[0]).toBe('graph');
    });

    it('migrates legacy ?query links to the fragment and strips the query', () => {
        goTo('/tools/json?code=hello&other=1');
        const { result } = renderHook(() => useUrlState('code', ''));
        expect(result.current[0]).toBe('hello');
        expect(window.location.search).toBe('?other=1');
        expect(window.location.hash).toBe('#code=hello');
    });

    it('drops the key when the value returns to the default', () => {
        goTo('/tools/json#code=x');
        const { result } = renderHook(() => useUrlState('code', 'default'));
        act(() => {
            result.current[1]('default');
            vi.advanceTimersByTime(300);
        });
        expect(window.location.hash).toBe('');
    });

    it('never writes sensitive values and scrubs them from old links', () => {
        goTo('/tools/jwt?token=eyJsecret#token=eyJsecret');
        const { result } = renderHook(() => useUrlState('token', '', { sensitive: true }));
        expect(result.current[0]).toBe('');
        expect(window.location.href).not.toContain('eyJsecret');
        act(() => {
            result.current[1]('eyJnew');
            vi.advanceTimersByTime(1000);
        });
        expect(result.current[0]).toBe('eyJnew');
        expect(window.location.href).not.toContain('eyJnew');
    });

    it('keeps oversized values in memory only', () => {
        const { result } = renderHook(() => useUrlState('code', '', { maxBytes: 10 }));
        act(() => {
            result.current[1]('x'.repeat(50));
            vi.advanceTimersByTime(300);
        });
        expect(result.current[0]).toHaveLength(50);
        expect(window.location.hash).toBe('');
    });

    it('writes several keys set in the same tick without losing any', () => {
        const { result: a } = renderHook(() => useUrlState('from', 'json'));
        const { result: b } = renderHook(() => useUrlState('to', 'yaml'));
        act(() => {
            a.current[1]('toml');
            b.current[1]('json');
            vi.advanceTimersByTime(300);
        });
        const params = new URLSearchParams(window.location.hash.slice(1));
        expect(params.get('from')).toBe('toml');
        expect(params.get('to')).toBe('json');
    });

    it('receives content handed off from another tool, including sensitive keys', () => {
        setHandoff('/tools/jwt', 'token', 'eyJhanded');
        goTo('/tools/jwt');
        const { result } = renderHook(() => useUrlState('token', '', { sensitive: true }));
        expect(result.current[0]).toBe('eyJhanded');
        expect(window.location.href).not.toContain('eyJhanded');
        expect(sessionStorage.getItem('utilhub_handoff')).toBeNull();
    });
});

describe('handoff', () => {
    beforeEach(() => sessionStorage.clear());

    it('is consumed only by the matching route and key', () => {
        setHandoff('/tools/json', 'code', '{}');
        expect(takeHandoff('/tools/sql', 'code')).toBeNull();
        expect(takeHandoff('/tools/json', 'other')).toBeNull();
        expect(takeHandoff('/tools/json', 'code')).toBe('{}');
        expect(takeHandoff('/tools/json', 'code')).toBeNull();
    });

    it('expires after a minute', () => {
        vi.useFakeTimers();
        setHandoff('/tools/json', 'code', '{}');
        vi.advanceTimersByTime(61_000);
        expect(takeHandoff('/tools/json', 'code')).toBeNull();
        vi.useRealTimers();
    });
});
