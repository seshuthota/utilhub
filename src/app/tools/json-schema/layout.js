import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/json-schema');

export default function Layout({ children }) {
    return children;
}
