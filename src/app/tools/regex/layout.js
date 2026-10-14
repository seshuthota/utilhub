import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/regex');

export default function Layout({ children }) {
    return children;
}
