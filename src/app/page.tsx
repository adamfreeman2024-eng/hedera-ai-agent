"use client";

import { Send, Sparkles, ShoppingBag } from "lucide-react";
import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image"; // Ավելացրել ենք Next.js-ի պաշտոնական Image կոմպոնենտը

// Խիստ տիպավորում մեր նամակների համար (ԶՐՈ 'any')
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  requiresConfirmation?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingData?: any;
};

// Մոկ տվյալներ կատալոգի համար (ՆՈՐ, ԼԵԳԵՆԴԱՐ ԱՊՐԱՆՔՆԵՐԸ)
const products = [
  { id: 1, name: "10,000 BTC Pizza", desc: "The legendary pizza that cost 10,000 BTC in 2010. Own a piece of history.", price: 1.0, category: "HISTORY", image: "/pizza.png" },
  { id: 2, name: "OG CryptoPunk #001", desc: "The absolute classic of the NFT world. Pure digital art.", price: 5.5, category: "NFT", image: "/punk.png" },
  { id: 3, name: "Golden Hashgraph Node", desc: "A rare digital representation of a Hedera mainnet node.", price: 2.2, category: "TECH", image: "/node.png" },
  { id: 4, name: "Vintage Web 1.0 Cursor", desc: "The original glowing arrow from the early internet era.", price: 0.5, category: "MEMORIES", image: "/cursor.png" },
];

// Տեքստի գեղեցիկ ֆորմատավորում (Bold և Սեղմվող Link-եր)
const formatMessage = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-0.5 rounded-md transition-colors underline-offset-2">
            {match[1]}
          </a>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
};

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendMessage = async (text: string, isConfirmation = false, pendingData: any = null) => {
    if (!text.trim() && !isConfirmation) return;
    if (isLoading) return;

    if (!isConfirmation) {
      // Date.now()-ի փոխարեն օգտագործում ենք crypto.randomUUID()
      const newUserMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
      setMessages((prev) => [...prev, newUserMsg]);
      setInput("");
    } else {
      // Եթե սեղմել է YES, նախորդ կոճակները թաքցնում ենք
      setMessages((prev) => prev.map((m) => (m.requiresConfirmation ? { ...m, requiresConfirmation: false } : m)));
    }

    setIsLoading(true);

    try {
      // Կապվում ենք մեր Hedera API-ի հետ
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          messages: [...messages], 
          confirmed: isConfirmation, 
          intentData: pendingData 
        }),
      });

      if (!res.ok) throw new Error("Սերվերի խնդիր");

      const data = await res.json();
      
      // Ավելացնում ենք Գործակալի պատասխանը
      const newAssistantMsg: Message = {
        id: crypto.randomUUID(), // Նորից անվտանգ ID
        role: "assistant",
        content: data.reply || data.message || "✅ Տրանզակցիան հաջողությամբ կատարվեց:",
        requiresConfirmation: data.requiresConfirmation,
        pendingData: data.pendingData,
      };
      setMessages((prev) => [...prev, newAssistantMsg]);

    } catch (error) {
      console.error("API Error:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
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
              Premium digital assets priced in HBAR. Select an item or ask the assistant to check out.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl border border-zinc-800 bg-[#121212] hover:border-zinc-700 transition-colors">
                {/* Օպտիմիզացված Next.js նկարը */}
                <Image 
                  src={p.image} 
                  alt={p.name} 
                  width={400} 
                  height={200} 
                  className="w-full h-32 object-cover rounded-xl mb-4" 
                />
                
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
              Hi — I can help you browse products and complete checkout with HBAR on Hedera. Try &quot;Show me what&apos;s available&quot; or &quot;Buy the 10,000 BTC Pizza&quot;.
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
                {/* Տեքստի և Link-երի նկարում */}
                {m.content.split('\n').map((line, i) => (
                  <div key={i} className="min-h-[1.2rem] whitespace-pre-wrap">{formatMessage(line)}</div>
                ))}

                {/* YES / NO Կոճակների նկարում */}
                {m.requiresConfirmation && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800/50">
                    <button
                      onClick={() => sendMessage("Yes, execute the transaction.", true, m.pendingData)}
                      className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
                    >
                      Yes, Confirm
                    </button>
                    <button
                      onClick={() => {
                        setMessages((prev) => prev.map((msg) => msg.id === m.id ? { ...msg, requiresConfirmation: false, content: msg.content + "\n\n❌ *Purchase cancelled by user.*" } : msg));
                      }}
                      className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold hover:bg-red-500/20 transition-colors"
                    >
                      No, Cancel
                    </button>
                  </div>
                )}
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
              <button onClick={() => sendMessage("Buy the 10,000 BTC Pizza")} className="px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                Buy BTC Pizza
              </button>
              <button onClick={() => sendMessage("Buy the Golden Node")} className="px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                Buy Golden Node
              </button>
            </div>
            
            <form onSubmit={onSubmit} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I want to buy the 10,000 BTC Pizza..."
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