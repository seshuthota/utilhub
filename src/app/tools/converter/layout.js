import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/converter');

export default function Layout({ children }) {
    return children;
}
