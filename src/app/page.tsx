import { ShoppingBag } from "lucide-react";

import { CheckoutChat } from "@/components/checkout-chat";
import { products } from "@/data/products";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 px-6 py-4 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                Hedera AI
              </p>
              <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                E-commerce Checkout Agent
              </h1>
            </div>
          </div>
          <span className="hidden rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 sm:inline">
            Testnet · Native server-side
          </span>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-zinc-800/60">
        <section className="flex flex-col overflow-hidden p-6 lg:p-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Catalog</h2>
            <p className="mt-1 max-w-md text-sm text-zinc-400">
              Premium tech accessories priced in HBAR. Select an item or ask the
              assistant to check out.
            </p>
          </div>

          <div className="mt-8 grid flex-1 gap-4 sm:grid-cols-2">
            {products.map((product, index) => (
              <article
                key={product.id}
                className={cn(
                  "group animate-fade-in rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition duration-300 hover:border-zinc-600 hover:bg-zinc-900/70",
                  index === 0 && "sm:col-span-2 lg:col-span-1",
                )}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {product.category}
                </p>
                <h3 className="mt-2 text-base font-semibold text-zinc-50">
                  {product.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                  {product.description}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-lg font-semibold tabular-nums text-zinc-100">
                    {product.priceInHbar}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      HBAR
                    </span>
                  </p>
                  <span className="rounded-lg bg-zinc-800/80 px-2 py-1 text-[10px] font-mono text-zinc-500 opacity-0 transition group-hover:opacity-100">
                    {product.id}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="flex min-h-[480px] flex-col bg-zinc-950 lg:min-h-0">
          <CheckoutChat products={products} />
        </section>
      </main>
    </div>
  );
}
