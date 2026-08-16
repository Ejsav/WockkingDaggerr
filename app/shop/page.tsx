"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ShopPage() {
  const categories = useMemo(() => {
    const set = new Set(MOCK_PRODUCTS.filter((p) => p.active).map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, []);

  const [category, setCategory] = useState<string>("all");

  const products = useMemo(
    () =>
      MOCK_PRODUCTS.filter((p) => p.active).filter((p) =>
        category === "all" ? true : p.category === category
      ),
    [category]
  );

  return (
    <>
      <section className="border-b border-white/10 pt-32 md:pt-44">
        <div className="mx-auto max-w-[1600px] px-5 pb-16 md:px-10 md:pb-24">
          <p className="eyebrow-blade mb-5">━━ THE STORE</p>
          <h1 className="display text-[clamp(3rem,12vw,10rem)] leading-[0.85] text-bone">
            ARMORY. <br />
            <span className="text-blade">FULLY STOCKED.</span>
          </h1>
          <p className="mt-8 max-w-xl text-bone/60 md:text-lg">
            Apparel, prints, accessories. Made in small runs, shipped in 48 hours. When something
            sells out, it's gone for the season.
          </p>
        </div>
      </section>

      <section className="sticky top-[68px] z-30 border-b border-white/10 bg-ink/85 backdrop-blur-md md:top-[76px]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-5 py-5 md:gap-4 md:px-10">
          {categories.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-all md:px-4 md:text-xs",
                  active
                    ? "border-blade bg-blade text-bone"
                    : "border-white/15 text-bone/70 hover:border-bone hover:text-bone"
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-20">
        <p className="eyebrow mb-6">{products.length} {products.length === 1 ? "PRODUCT" : "PRODUCTS"}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
