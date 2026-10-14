import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/color');

export default function Layout({ children }) {
    return children;
}
