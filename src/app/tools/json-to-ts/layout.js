import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/json-to-ts');

export default function Layout({ children }) {
    return children;
}
