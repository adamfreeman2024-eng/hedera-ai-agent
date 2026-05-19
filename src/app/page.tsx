"use client";

import { Send, Sparkles, ShoppingBag } from "lucide-react";
import { useState, useRef, useEffect, FormEvent } from "react";

// Խիստ տիպավորում մեր նամակների համար (ԶՐՈ 'any')
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Մոկ տվյալներ կատալոգի համար
const products = [
  { id: 1, name: "Aurora Wireless Headphones", desc: "Noise-cancelling over-ear headphones with 32-hour battery life.", price: 12.5, category: "AUDIO" },
  { id: 2, name: "Lumen Mechanical Keyboard", desc: "Low-profile mechanical switches with per-key RGB and USB-C.", price: 8.75, category: "PERIPHERALS" },
  { id: 3, name: 'Vertex 27" 4K Monitor', desc: "IPS panel, 144Hz, HDR400 — ideal for design and development.", price: 45, category: "DISPLAYS" },
  { id: 4, name: "Nexus USB-C Dock", desc: "12-in-1 hub with dual HDMI, 1GbE, and 100W pass-through charging.", price: 6.25, category: "ACCESSORIES" },
];

export default function CheckoutPage() {
  // Մաքուր Native React State-ներ
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Նամակ ուղարկելու Գլխավոր Ֆունկցիան
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Ավելացնում ենք մարդու նամակը չատում
    const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Կապվում ենք մեր Hedera API-ի հետ
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, messages: [...messages, newUserMsg] }),
      });

      if (!res.ok) throw new Error("Սերվերի խնդիր");

      const data = await res.json();
      
      // Ավելացնում ենք Գործակալի պատասխանը
      const newAssistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || data.message || "✅ Տրանզակցիան հաջողությամբ կատարվեց:",
      };
      setMessages((prev) => [...prev, newAssistantMsg]);

    } catch (error) {
      console.error("API Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Կապի խափանում: Ստուգեք ձեր API բանալիները .env.local ֆայլում և տերմինալի logs-երը:",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans p-6">
      <header className="flex items-center justify-between pb-6 border-b border-zinc-800 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black p-2 rounded-xl">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Hedera AI</h2>
            <h1 className="text-xl font-semibold text-white">E-commerce Checkout Agent</h1>
          </div>
        </div>
        <div className="px-4 py-1.5 rounded-full border border-zinc-800 text-xs font-medium text-zinc-400">
          Testnet · Native server-side
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">Catalog</h2>
            <p className="text-zinc-400 text-sm">
              Premium tech accessories priced in HBAR. Select an item or ask the assistant to check out.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl border border-zinc-800 bg-[#121212] hover:border-zinc-700 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 block">{p.category}</span>
                <h3 className="font-medium text-white mb-2">{p.name}</h3>
                <p className="text-xs text-zinc-400 mb-4 h-12">{p.desc}</p>
                <div className="font-semibold text-white">
                  {p.price} <span className="text-xs text-zinc-500 font-normal">HBAR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col h-[75vh]">
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 text-emerald-400 text-xs font-medium mb-4 border border-emerald-900/50">
              <Sparkles size={12} /> AI + Hedera Native
            </div>
            <h2 className="text-2xl font-semibold text-white mb-1">Checkout Assistant</h2>
            <p className="text-zinc-400 text-sm">Powered by Gemini intent parsing and Hedera Agent Kit V4</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            <div className="bg-[#121212] border border-zinc-800 p-4 rounded-2xl text-sm text-zinc-300">
              Hi — I can help you browse products and complete checkout with HBAR on Hedera. Try &quot;Show me what&apos;s available&quot; or &quot;Buy the Aurora headphones&quot;.
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl text-sm border ${
                  m.role === "user"
                    ? "bg-zinc-900 border-zinc-800 text-white ml-auto max-w-[85%]"
                    : "bg-[#121212] border-zinc-800 text-emerald-50 mr-auto max-w-[95%]"
                }`}
              >
                {m.content}
              </div>
            ))}
            {isLoading && (
              <div className="p-4 rounded-2xl text-sm border bg-[#121212] border-zinc-800 text-emerald-400 w-fit animate-pulse">
                Processing securely via Hedera...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => sendMessage("Buy Aurora headphones")} className="px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                Buy Aurora
              </button>
              <button onClick={() => sendMessage("Buy Lumen keyboard")} className="px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                Buy Lumen
              </button>
            </div>
            
            <form onSubmit={onSubmit} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I want to buy the Aurora Wireless Headphones..."
                className="w-full bg-[#121212] border border-zinc-800 rounded-full py-3 pl-5 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}