'use client';

import dynamic from "next/dynamic";
import { FileCode } from "lucide-react";
import ToolCard from "@/components/common/ToolCard";

const Converter = dynamic(() => import("./Converter"), {
    ssr: false,
    loading: () => (
        <div className="p-8 text-center text-gray-500">
            Loading converter...
        </div>
    ),
});

export default function CurlConverter() {
    return (
        <div className="tool-page">
            <ToolCard
                id="curl"
                title="Curl Converter"
                description="Convert cURL commands to Python, JavaScript, Go, and more."
                icon={FileCode}
                href="/tools/curl"
                isClientSideOnly={true}
            />
            <Converter />
        </div>
    );
}
