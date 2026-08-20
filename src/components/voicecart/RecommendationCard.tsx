import { motion } from "motion/react";
import { CalendarHeart, History, Repeat2 } from "lucide-react";

import { enter, springs } from "@/lib/voicecart/motion";
import { productById, type Suggestion } from "@/lib/voicecart/data";
import { useVoiceCart } from "@/lib/voicecart/store";

const KIND_META = {
  habit: { icon: History, label: "Habit", tint: "from-primary/18" },
  seasonal: { icon: CalendarHeart, label: "Seasonal", tint: "from-warning/18" },
  substitute: { icon: Repeat2, label: "Substitute", tint: "from-accent/18" },
} as const;

export function RecommendationCard({
  suggestion,
  onOptions,
}: {
  suggestion: Suggestion;
  onOptions: (suggestion: Suggestion) => void;
}) {
  const { addItem, t } = useVoiceCart();
  const meta = KIND_META[suggestion.kind];
  const Icon = meta.icon;
  const product = productById(suggestion.productId);

  return (
    <motion.article
      variants={enter}
      whileHover={{ y: -3 }}
      transition={springs.ui}
      className={`glass relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.tint} to-transparent p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-glass-strong text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </div>
        <span className="rounded-full border border-border bg-glass px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
          {meta.label.toUpperCase()}
        </span>
      </div>

      <h3 className="mt-3.5 text-base font-semibold">{suggestion.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{suggestion.line1}</p>
      {suggestion.line2 && (
        <p className="mt-0.5 text-xs text-muted-foreground/80">{suggestion.line2}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        {product && (
          <span className="text-xs text-muted-foreground">
            {product.brand} · {product.size} · ₹{product.price}
          </span>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={springs.snap}
          onClick={() => {
            if (suggestion.cta === "options") {
              onOptions(suggestion);
              return;
            }
            if (product) {
              addItem({
                name: product.name,
                category: product.category,
                quantity: 1,
                unit: product.unit,
              });
            }
          }}
          className="shrink-0 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/25"
        >
          {suggestion.cta === "options" ? t("viewOptions") : t("add")}
        </motion.button>
      </div>
    </motion.article>
  );
}
