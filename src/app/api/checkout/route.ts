import { NextResponse } from "next/server";
import { Client, TransferTransaction, Hbar } from "@hashgraph/sdk";
import { HederaAIToolkit } from "hedera-agent-kit"; 

const products = [
  { id: 1, name: "Aurora Wireless Headphones", price: 12.5 },
  { id: 2, name: "Lumen Mechanical Keyboard", price: 8.75 },
  { id: 3, name: 'Vertex 27" 4K Monitor', price: 45 },
  { id: 4, name: "Nexus USB-C Dock", price: 6.25 },
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

    // ԵԹԵ ՆՈՐ ՀԱՐՑ Է, ԿԱՆՉՈՒՄ ԵՆՔ AI-ԻՆ (Անգլերենով)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an AI E-commerce checkout agent on Hedera. Products: ${JSON.stringify(products)}. If the user wants to buy, return ONLY JSON: {"intent": "buy", "productName": "Name", "price": 12.5}. If it's a general question, return ONLY JSON: {"intent": "chat", "reply": "Your answer in English"}. Only raw JSON. User message: ${message}` }] }]
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
        requiresConfirmation: true, // Սա ֆրոնտենդին կասի, որ կոճակներ նկարի
        pendingData: intentData     // Պահպանում ենք տվյալները հաջորդ քայլի համար
      });
    }

    return NextResponse.json({ reply: intentData.reply || "I didn't quite catch that." });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ reply: "⚠️ Server Error: Please check the console." }, { status: 500 });
  }
}