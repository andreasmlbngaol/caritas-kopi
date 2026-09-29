import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname
    },
    outputFileTracingIncludes: {
        "/**/*": ["./app/generated/prisma/**/*"],
    },
};

export default nextConfig;
