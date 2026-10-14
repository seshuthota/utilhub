import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/sql');

export default function Layout({ children }) {
    return children;
}
