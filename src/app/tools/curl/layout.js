import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/curl');

export default function Layout({ children }) {
    return children;
}
