import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/pipeline');

export default function Layout({ children }) {
    return children;
}
