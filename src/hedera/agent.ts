import "server-only";

import {
  AgentMode,
  HederaAgentAPI,
  ToolDiscovery,
  type Configuration,
  type Context,
  type PostParamsNormalizationParams,
} from "@hashgraph/hedera-agent-kit";
import { AbstractPolicy } from "@hashgraph/hedera-agent-kit";
import {
  coreAccountPlugin,
  coreAccountPluginToolNames,
} from "@hashgraph/hedera-agent-kit/plugins";
import { HederaAIToolkit } from "@hashgraph/hedera-agent-kit-ai-sdk";
import { Client, Hbar, PrivateKey } from "@hiero-ledger/sdk";

import { getHederaEnv } from "@/hedera/tools";

const MAX_TRANSFER_HBAR = 100;

interface HbarTransferLike {
  amount: unknown;
}

interface NormalisedTransferParams {
  hbarTransfers?: HbarTransferLike[];
}

function amountToHbar(value: unknown): number {
  if (typeof value === "number") {
    return Math.abs(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
  }

  if (value instanceof Hbar) {
    return Math.abs(value.toBigNumber().dividedBy(100_000_000).toNumber());
  }

  if (
    value !== null &&
    typeof value === "object" &&
    "toBigNumber" in value &&
    typeof (value as { toBigNumber: unknown }).toBigNumber === "function"
  ) {
    const tinybars = (
      value as { toBigNumber: () => { toNumber: () => number } }
    )
      .toBigNumber()
      .toNumber();
    return Math.abs(tinybars / 100_000_000);
  }

  return 0;
}

function sumOutgoingHbar(transfers: HbarTransferLike[]): number {
  return transfers.reduce((total, transfer) => {
    return total + amountToHbar(transfer.amount);
  }, 0);
}

/**
 * Blocks HBAR transfers that exceed the configured ceiling (100 HBAR).
 */
export class PaymentGuardrailPolicy extends AbstractPolicy {
  readonly name = "Payment Guardrail Policy";
  readonly description = `Blocks transfers over ${MAX_TRANSFER_HBAR} HBAR`;
  readonly relevantTools = [
    coreAccountPluginToolNames.TRANSFER_HBAR_TOOL,
    coreAccountPluginToolNames.TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
  ];

  protected shouldBlockPostParamsNormalization(
    params: PostParamsNormalizationParams,
    method: string,
  ): boolean {
    if (
      !this.relevantTools.includes(
        method as (typeof this.relevantTools)[number],
      )
    ) {
      return false;
    }

    const normalised = params.normalisedParams as NormalisedTransferParams;
    const transfers = normalised.hbarTransfers ?? [];
    const totalHbar = sumOutgoingHbar(transfers);

    if (totalHbar > MAX_TRANSFER_HBAR) {
      console.warn(
        `PaymentGuardrailPolicy: blocked ${method} — ${totalHbar} HBAR exceeds ${MAX_TRANSFER_HBAR} HBAR limit.`,
      );
      return true;
    }

    return false;
  }
}

export const paymentGuardrailPolicy = new PaymentGuardrailPolicy();

export interface HederaAgentKit {
  client: Client;
  api: HederaAgentAPI;
  aiToolkit: HederaAIToolkit;
  context: Context;
  configuration: Configuration;
}

let cachedKit: HederaAgentKit | null = null;

function createHederaClient(): Client {
  const env = getHederaEnv();

  const client =
    env.network === "mainnet"
      ? Client.forMainnet()
      : env.network === "previewnet"
        ? Client.forPreviewnet()
        : Client.forTestnet();

  client.setOperator(
    env.accountId,
    PrivateKey.fromString(env.privateKey),
  );

  return client;
}

/**
 * Initializes Hedera Agent Kit V4 (core API + Vercel AI SDK toolkit) with guardrails.
 */
export function getHederaAgentKit(): HederaAgentKit {
  if (cachedKit) {
    return cachedKit;
  }

  const env = getHederaEnv();
  const client = createHederaClient();

  const context: Context = {
    accountId: env.accountId,
    mode: AgentMode.AUTONOMOUS,
    hooks: [paymentGuardrailPolicy],
  };

  const configuration: Configuration = {
    plugins: [coreAccountPlugin],
    tools: [coreAccountPluginToolNames.TRANSFER_HBAR_TOOL],
    context,
  };

  const discovery = ToolDiscovery.createFromConfiguration(configuration);
  const tools = discovery.getAllTools(context, configuration);
  const api = new HederaAgentAPI(client, context, tools);
  const aiToolkit = new HederaAIToolkit({ client, configuration });

  cachedKit = {
    client,
    api,
    aiToolkit,
    context,
    configuration,
  };

  return cachedKit;
}
