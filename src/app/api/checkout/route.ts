import { NextResponse } from "next/server";
import { z } from "zod";

import { getProductById, products } from "@/data/products";
import { getHederaAgentKit } from "@/hedera/agent";
import { transferProductPayment } from "@/hedera/tools";
import { parseCheckoutIntent } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
});

export interface CheckoutApiResponse {
  reply: string;
  intent: string;
  productId: string | null;
  payment?: {
    amountHbar: number;
    merchantAccountId: string;
    transactionResult: string;
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const { message } = requestSchema.parse(body);

    const intent = await parseCheckoutIntent(message);

    if (intent.intent === "list_products") {
      const catalog = products
        .map((p) => `• ${p.name} — ${p.priceInHbar} HBAR`)
        .join("\n");

      return NextResponse.json({
        reply: `${intent.reply}\n\n${catalog}`,
        intent: intent.intent,
        productId: null,
      } satisfies CheckoutApiResponse);
    }

    if (intent.intent === "product_info") {
      const product = intent.productId
        ? getProductById(intent.productId)
        : undefined;

      if (!product) {
        return NextResponse.json({
          reply:
            "I could not find that product. Try asking to see all products or name an item from the catalog.",
          intent: intent.intent,
          productId: intent.productId,
        } satisfies CheckoutApiResponse);
      }

      return NextResponse.json({
        reply: `${intent.reply}\n\n${product.name} — ${product.priceInHbar} HBAR\n${product.description}`,
        intent: intent.intent,
        productId: product.id,
      } satisfies CheckoutApiResponse);
    }

    if (intent.intent === "checkout") {
      if (!intent.productId) {
        return NextResponse.json({
          reply:
            "Which product would you like to buy? You can say the product name or pick one from the catalog on the left.",
          intent: intent.intent,
          productId: null,
        } satisfies CheckoutApiResponse);
      }

      const product = getProductById(intent.productId);

      if (!product) {
        return NextResponse.json({
          reply:
            "That product is not in our catalog. Please choose one of the items shown on the left.",
          intent: intent.intent,
          productId: intent.productId,
        } satisfies CheckoutApiResponse);
      }

      const { api } = getHederaAgentKit();
      const payment = await transferProductPayment(api, { product });

      return NextResponse.json({
        reply: `${intent.reply}\n\nPayment sent: ${product.name} for ${product.priceInHbar} HBAR.\n${payment.transactionResult}`,
        intent: intent.intent,
        productId: product.id,
        payment: {
          amountHbar: payment.amountHbar,
          merchantAccountId: payment.merchantAccountId,
          transactionResult: payment.transactionResult,
        },
      } satisfies CheckoutApiResponse);
    }

    return NextResponse.json({
      reply: intent.reply,
      intent: intent.intent,
      productId: intent.productId,
    } satisfies CheckoutApiResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout request failed";

    console.error("[checkout]", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
