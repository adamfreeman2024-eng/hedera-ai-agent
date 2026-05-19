import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import { products } from "@/data/products";

const intentSchema = z.object({
  intent: z.enum(["checkout", "list_products", "product_info", "unknown"]),
  productId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reply: z.string(),
});

export type CheckoutIntent = z.infer<typeof intentSchema>;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const geminiModel = google("gemini-2.5-flash");

function buildCatalogContext(): string {
  return products
    .map(
      (product) =>
        `- id: ${product.id} | name: ${product.name} | price: ${product.priceInHbar} HBAR | category: ${product.category}`,
    )
    .join("\n");
}

export async function parseCheckoutIntent(
  userMessage: string,
): Promise<CheckoutIntent> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to .env.local",
    );
  }

  const { object } = await generateObject({
    model: geminiModel,
    schema: intentSchema,
    system: `You are the intent parser for "Hedera AI E-commerce Checkout Agent".
Classify the shopper message into one intent:
- checkout: user wants to buy/pay for a product
- list_products: user asks what is available
- product_info: user asks about a specific product
- unknown: anything else

Product catalog:
${buildCatalogContext()}

Rules:
- Match productId to the closest catalog id when checkout or product_info.
- Use null productId when not applicable.
- reply: short, friendly assistant text (1-2 sentences) acknowledging the user.`,
    prompt: userMessage,
  });

  return object;
}
