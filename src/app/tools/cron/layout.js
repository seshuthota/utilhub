import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/cron');

export default function Layout({ children }) {
    return children;
}
