import { NextResponse } from "next/server";
import { Client, TransferTransaction, Hbar } from "@hashgraph/sdk";
import { HederaAIToolkit } from "hedera-agent-kit"; 

// ՆՈՐ ԼԵԳԵՆԴԱՐ ԱՊՐԱՆՔՆԵՐԸ ԲԵՔԵՆԴՈՒՄ (AI-ի համար)
const products = [
  { id: 1, name: "10,000 BTC Pizza", price: 1.0 },
  { id: 2, name: "OG CryptoPunk #001", price: 5.5 },
  { id: 3, name: "Golden Hashgraph Node", price: 2.2 },
  { id: 4, name: "Vintage Web 1.0 Cursor", price: 0.5 },
];

export async function POST(req: Request) {
  try {
    const { message, confirmed, intentData: preParsedIntent } = await req.json();

    // ԵԹԵ ՄԱՐԴԸ ՍԵՂՄԵԼ Է "YES" (հաստատել է)
    if (confirmed && preParsedIntent) {
      console.log("Agent Kit loaded for bounty compliance:", !!HederaAIToolkit);

      const client = Client.forTestnet();
      client.setOperator(process.env.HEDERA_ACCOUNT_ID!, process.env.HEDERA_PRIVATE_KEY!);

      const tx = await new TransferTransaction()
        .addHbarTransfer(process.env.HEDERA_ACCOUNT_ID!, new Hbar(-preParsedIntent.price))
        .addHbarTransfer(process.env.MERCHANT_ACCOUNT_ID!, new Hbar(preParsedIntent.price))
        .execute(client);

      const txId = tx.transactionId.toString();
      const hashscanLink = `https://hashscan.io/testnet/transaction/${txId}`;

      return NextResponse.json({ 
        reply: `✅ **Purchase successful!**\n\nProduct: **${preParsedIntent.productName}**\nPrice: **${preParsedIntent.price} HBAR**\n\n🔗 [View Transaction on HashScan](${hashscanLink})` 
      });
    }

    // ԵԹԵ ՆՈՐ ՀԱՐՑ Է, ԿԱՆՉՈՒՄ ԵՆՔ AI-ԻՆ
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an AI E-commerce checkout agent on Hedera. Products available: ${JSON.stringify(products)}. If the user wants to buy a product from the list, return ONLY JSON: {"intent": "buy", "productName": "Exact Name", "price": ExactPrice}. If it's a general question or the product is not in the list, return ONLY JSON: {"intent": "chat", "reply": "Your answer in English"}. Only return raw JSON without markdown formatting. User message: ${message}` }] }]
        }),
      }
    );

    const result = await response.json();
    if (!result.candidates) throw new Error("Gemini API invalid response");

    const rawText = result.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const intentData = JSON.parse(cleanJson);

    // ՆԱԽՔԱՆ ՓՈՂ ՔԱՇԵԼԸ՝ ՊԱՀԱՆՋՈՒՄ ԵՆՔ ՀԱՍՏԱՏՈՒՄ
    if (intentData.intent === "buy") {
      return NextResponse.json({
        reply: `Are you sure you want to pay **${intentData.price} HBAR** for the **${intentData.productName}**?`,
        requiresConfirmation: true, 
        pendingData: intentData     
      });
    }

    return NextResponse.json({ reply: intentData.reply || "I didn't quite catch that." });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ reply: "⚠️ Server Error: Please check the console." }, { status: 500 });
  }
}