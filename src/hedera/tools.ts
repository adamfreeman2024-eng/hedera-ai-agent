import "server-only";

import { coreAccountPluginToolNames } from "@hashgraph/hedera-agent-kit/plugins";
import type { HederaAgentAPI } from "@hashgraph/hedera-agent-kit";

import type { Product } from "@/data/products";

export interface HederaEnvConfig {
  network: "testnet" | "mainnet" | "previewnet";
  accountId: string;
  privateKey: string;
  merchantAccountId: string;
}

export function getHederaEnv(): HederaEnvConfig {
  const network = process.env.HEDERA_NETWORK ?? "testnet";
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const merchantAccountId = process.env.MERCHANT_ACCOUNT_ID;

  if (!accountId || !privateKey || !merchantAccountId) {
    throw new Error(
      "Missing Hedera configuration. Set HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, and MERCHANT_ACCOUNT_ID in .env.local",
    );
  }

  if (
    network !== "testnet" &&
    network !== "mainnet" &&
    network !== "previewnet"
  ) {
    throw new Error(
      `Invalid HEDERA_NETWORK "${network}". Use testnet, mainnet, or previewnet.`,
    );
  }

  return {
    network,
    accountId,
    privateKey,
    merchantAccountId,
  };
}

export interface TransferPaymentInput {
  product: Product;
  memo?: string;
}

export interface TransferPaymentResult {
  success: boolean;
  transactionResult: string;
  amountHbar: number;
  merchantAccountId: string;
}

/**
 * Executes a guarded HBAR payment to the merchant for a catalog product.
 */
export async function transferProductPayment(
  api: HederaAgentAPI,
  input: TransferPaymentInput,
): Promise<TransferPaymentResult> {
  const { merchantAccountId } = getHederaEnv();
  const { product, memo } = input;

  const transactionMemo =
    memo ?? `Hedera AI Checkout — ${product.name} (${product.id})`;

  const transactionResult = await api.run(
    coreAccountPluginToolNames.TRANSFER_HBAR_TOOL,
    {
      transfers: [
        {
          accountId: merchantAccountId,
          amount: product.priceInHbar,
        },
      ],
      transactionMemo,
    },
  );

  return {
    success: true,
    transactionResult,
    amountHbar: product.priceInHbar,
    merchantAccountId,
  };
}
