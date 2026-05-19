"use client";

import { Loader2, Send, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import type { CheckoutApiResponse } from "@/app/api/checkout/route";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CheckoutChatProps {
  products: Product[];
}

export function CheckoutChat({ products }: CheckoutChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I can help you browse products and complete checkout with HBAR on Hedera. Try “Show me what’s available” or “Buy the Aurora headphones”.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed },
      ]);
      setInput("");
      setIsLoading(true);
      scrollToBottom();

      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        const data: CheckoutApiResponse | { error: string } =
          await response.json();

        if (!response.ok) {
          const errorText =
            "error" in data ? data.error : "Something went wrong.";
          throw new Error(errorText);
        }

        const success = data as CheckoutApiResponse;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: success.reply,
          },
        ]);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Request failed.";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Sorry — ${errorMessage}`,
          },
        ]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [isLoading, scrollToBottom],
  );

  const quickCheckout = (product: Product) => {
    void sendMessage(`Buy ${product.name}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-zinc-800/80 px-6 py-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          AI + Hedera Native
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-50">
          Checkout Assistant
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Powered by Gemini intent parsing and Hedera Agent Kit V4
        </p>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "animate-fade-in max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              message.role === "user"
                ? "ml-auto bg-zinc-100 text-zinc-900"
                : "mr-auto border border-zinc-800 bg-zinc-900/80 text-zinc-100",
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {isLoading ? (
          <div className="mr-auto flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing on Hedera…
          </div>
        ) : null}
      </div>

      <div className="border-t border-zinc-800/80 px-6 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {products.slice(0, 2).map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => quickCheckout(product)}
              disabled={isLoading}
              className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
            >
              Buy {product.name.split(" ")[0]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void sendMessage("What products do you have?")}
            disabled={isLoading}
            className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
          >
            View catalog
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
          className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-2 pl-4 shadow-inner"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask to buy a product or check prices…"
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 transition hover:bg-white disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
