import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/css-lint');

export default function Layout({ children }) {
    return children;
}
