import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/curl-tester');

export default function Layout({ children }) {
    return children;
}
