import { describe, it, expect } from 'vitest';
import { tools } from '@/config/tools';
import {
    getToolByHref,
    getToolMetadata,
    getPrivacyVariants,
    DEFAULT_TOOLS_METADATA,
} from '@/config/toolMetadata';

describe('toolMetadata', () => {
    it('finds tools by href, ignoring query, hash, and trailing slash', () => {
        expect(getToolByHref('/tools/json')?.id).toBe('json');
        expect(getToolByHref('/tools/json/')?.id).toBe('json');
        expect(getToolByHref('/tools/json?code=1#x')?.id).toBe('json');
        expect(getToolByHref('/tools/nope')).toBeUndefined();
        expect(getToolByHref(null)).toBeUndefined();
    });

    it('builds per-tool title and description', () => {
        const json = tools.find((t) => t.href === '/tools/json');
        expect(getToolMetadata('/tools/json')).toEqual({
            title: `${json.title} | UtilHub`,
            description: json.description,
        });
        expect(getToolMetadata('/tools/unknown')).toEqual(DEFAULT_TOOLS_METADATA);
    });

    it('has metadata for every registered tool', () => {
        for (const tool of tools) {
            expect(getToolMetadata(tool.href).title).toBe(`${tool.title} | UtilHub`);
        }
    });

    describe('getPrivacyVariants', () => {
        it('claims client-side only when nothing leaves the browser', () => {
            expect(getPrivacyVariants({ isClientSideOnly: true })).toEqual(['client-side']);
        });

        it('does not claim client-side for AI tools', () => {
            expect(getPrivacyVariants({ isClientSideOnly: true, hasAiFeatures: true })).toEqual(['ai-enabled']);
        });

        it('does not claim client-side for network tools', () => {
            expect(getPrivacyVariants({ isClientSideOnly: true, usesNetwork: true })).toEqual(['network']);
        });

        it('shows both AI and network when both apply', () => {
            expect(getPrivacyVariants({ isClientSideOnly: true, hasAiFeatures: true, usesNetwork: true }))
                .toEqual(['ai-enabled', 'network']);
        });

        it('only treats usesNetwork === true as network', () => {
            expect(getPrivacyVariants({ isClientSideOnly: true, usesNetwork: 'yes' })).toEqual(['client-side']);
        });

        it('returns nothing for a missing tool', () => {
            expect(getPrivacyVariants(undefined)).toEqual([]);
        });
    });
});
