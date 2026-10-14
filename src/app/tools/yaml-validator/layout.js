import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/yaml-validator');

export default function Layout({ children }) {
    return children;
}
