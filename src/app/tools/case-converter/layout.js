import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/case-converter');

export default function Layout({ children }) {
    return children;
}
