import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/yaml');

export default function Layout({ children }) {
    return children;
}
