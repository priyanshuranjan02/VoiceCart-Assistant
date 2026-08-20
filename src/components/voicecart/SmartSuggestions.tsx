import { motion } from "motion/react";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { RecommendationCard } from "./RecommendationCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRODUCTS, productById, type Suggestion } from "@/lib/voicecart/data";
import { staggerParent } from "@/lib/voicecart/motion";
import { useVoiceCart } from "@/lib/voicecart/store";

function SuggestionSkeleton() {
  return (
    <div className="glass rounded-2xl p-4" aria-hidden>
      <div className="h-9 w-9 animate-pulse rounded-xl bg-secondary" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-secondary" />
      <div className="mt-2.5 h-3 w-3/4 animate-pulse rounded bg-secondary/70" />
      <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-secondary/60" />
    </div>
  );
}

export function SmartSuggestions({ loading = false }: { loading?: boolean }) {
  const { t, addItem, suggestions } = useVoiceCart();
  const [substituteFor, setSubstituteFor] = useState<Suggestion | null>(null);

  const base = substituteFor ? productById(substituteFor.productId) : undefined;
  const options = base
    ? PRODUCTS.filter(
        (product) => product.category === base.category && product.name !== base.name,
      ).slice(0, 4)
    : [];

  return (
    <section aria-label={t("smartSuggestions")}>
      <header className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{t("smartSuggestions")}</h2>
          <p className="text-xs text-muted-foreground">{t("suggestionsSub")}</p>
        </div>
      </header>

      {loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SuggestionSkeleton />
          <SuggestionSkeleton />
          <SuggestionSkeleton />
        </div>
      ) : (
        <motion.div
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {suggestions.map((suggestion) => (
            <RecommendationCard
              key={suggestion.id}
              suggestion={suggestion}
              onOptions={setSubstituteFor}
            />
          ))}
        </motion.div>
      )}

      <Dialog open={!!substituteFor} onOpenChange={(open) => !open && setSubstituteFor(null)}>
        <DialogContent className="glass max-w-md rounded-3xl border-border-strong">
          <DialogHeader>
            <DialogTitle>Alternatives to {base?.name}</DialogTitle>
            <DialogDescription>
              Similar products in {base?.category}, ranked by how often people swap them.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {options.map((option) => (
              <li
                key={option.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-glass px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{option.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {option.brand} · {option.size} · ₹{option.price}
                  </p>
                </div>
                <button
                  onClick={() => {
                    addItem({
                      name: option.name,
                      category: option.category,
                      quantity: 1,
                      unit: option.unit,
                      brand: option.brand,
                      price: option.price,
                    });
                    setSubstituteFor(null);
                  }}
                  className="shrink-0 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/25"
                >
                  {t("add")}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
