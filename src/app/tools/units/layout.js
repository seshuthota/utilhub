import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/units');

export default function Layout({ children }) {
    return children;
}
