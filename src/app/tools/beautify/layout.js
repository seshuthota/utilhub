import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/beautify');

export default function Layout({ children }) {
    return children;
}
