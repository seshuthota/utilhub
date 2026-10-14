import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/sqlite');

export default function Layout({ children }) {
    return children;
}
