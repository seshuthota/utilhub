import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/favicon');

export default function Layout({ children }) {
    return children;
}
