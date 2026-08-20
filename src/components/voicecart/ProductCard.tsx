import { motion } from "motion/react";
import { Apple, Beef, Cookie, Croissant, Milk, Sparkle } from "lucide-react";

import { enter, springs } from "@/lib/voicecart/motion";
import type { Product } from "@/lib/voicecart/data";
import { useVoiceCart } from "@/lib/voicecart/store";

const ICONS = {
  Dairy: Milk,
  Produce: Apple,
  Bakery: Croissant,
  Snacks: Cookie,
  "Personal Care": Sparkle,
} as const;

export function ProductCard({ product }: { product: Product }) {
  const { addItem, t } = useVoiceCart();
  const Icon = ICONS[product.category] ?? Beef;

  return (
    <motion.article
      variants={enter}
      whileHover={{ y: -2 }}
      transition={springs.ui}
      className="glass flex items-center gap-3.5 rounded-2xl p-3.5"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-primary/20 to-transparent text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium">{product.name}</h3>
          {product.organic && (
            <span className="shrink-0 rounded-full border border-success/40 bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
              Organic
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {product.brand} · {product.size}
        </p>
        <p className="mt-1 text-xs">
          <span className="font-semibold text-foreground">₹{product.price}</span>
          <span className={product.available ? "text-success" : "text-warning"}>
            {" · "}
            {product.available ? "In stock" : "Out of stock"}
          </span>
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.94 }}
        transition={springs.snap}
        disabled={!product.available}
        onClick={() =>
          addItem({
            name: product.name,
            category: product.category,
            quantity: 1,
            unit: product.unit,
          })
        }
        className="shrink-0 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/25 disabled:opacity-40"
      >
        {t("add")}
      </motion.button>
    </motion.article>
  );
}
