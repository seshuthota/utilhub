'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFavorites } from '@/components/FavoritesProvider';
import PrivacyBadge, { BadgeVariant } from '@/components/common/PrivacyBadge';
import { getToolByHref, getPrivacyVariants } from '@/config/toolMetadata';
import styles from './ToolRouteInfo.module.css';

/**
 * Rendered by the /tools layout above every tool page:
 * - shows the tool's privacy badges (from the registry) before the tool is used
 * - records the visit in "recently used", however the route was reached
 *   (dashboard, command palette, Send to…, direct link).
 */
export default function ToolRouteInfo() {
    const pathname = usePathname();
    const { addRecent } = useFavorites();
    const tool = getToolByHref(pathname);
    const toolId: string | undefined = tool?.id;

    useEffect(() => {
        if (toolId) addRecent(toolId);
    }, [toolId, addRecent]);

    if (!tool) return null;
    const variants = getPrivacyVariants(tool) as BadgeVariant[];
    if (variants.length === 0) return null;

    return (
        <div className={styles.badges} role="group" aria-label="Data handling">
            {variants.map((variant) => (
                <PrivacyBadge key={variant} variant={variant} />
            ))}
        </div>
    );
}
