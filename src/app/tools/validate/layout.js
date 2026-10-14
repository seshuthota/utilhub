import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/validate');

export default function Layout({ children }) {
    return children;
}
