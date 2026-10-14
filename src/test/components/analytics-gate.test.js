import { describe, it, expect, beforeEach } from 'vitest';
import { scrubAnalyticsEvent, ANALYTICS_OPT_OUT_KEY } from '@/components/AnalyticsGate';

describe('analytics scrubbing', () => {
    beforeEach(() => localStorage.clear());

    it('reports only origin + path — no query string or fragment', () => {
        const out = scrubAnalyticsEvent({
            type: 'pageview',
            url: 'https://utilhub.test/tools/jwt?token=eyJabc#code=secret',
        });
        expect(out.url).toBe('https://utilhub.test/tools/jwt');
    });

    it('sends nothing after the user opts out', () => {
        localStorage.setItem(ANALYTICS_OPT_OUT_KEY, '1');
        expect(scrubAnalyticsEvent({ type: 'pageview', url: 'https://utilhub.test/' })).toBeNull();
    });

    it('sends nothing when the browser signals Global Privacy Control', () => {
        Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
        expect(scrubAnalyticsEvent({ type: 'pageview', url: 'https://utilhub.test/' })).toBeNull();
        delete navigator.globalPrivacyControl;
    });
});
