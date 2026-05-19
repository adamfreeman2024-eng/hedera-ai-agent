import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@hiero-ledger/sdk",
    "@hashgraph/hedera-agent-kit",
    "@hashgraph/hedera-agent-kit-ai-sdk",
  ],
};

export default nextConfig;
