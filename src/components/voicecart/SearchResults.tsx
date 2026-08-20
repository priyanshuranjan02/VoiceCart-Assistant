import { motion } from "motion/react";
import { PackageSearch } from "lucide-react";

import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/voicecart/data";
import { staggerParent } from "@/lib/voicecart/motion";
import { useVoiceCart } from "@/lib/voicecart/store";

function ResultSkeleton() {
  return (
    <div className="glass flex items-center gap-3.5 rounded-2xl p-3.5" aria-hidden>
      <div className="h-12 w-12 animate-pulse rounded-xl bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
        <div className="h-2.5 w-1/4 animate-pulse rounded bg-secondary/70" />
        <div className="h-2.5 w-1/5 animate-pulse rounded bg-secondary/60" />
      </div>
    </div>
  );
}

export function SearchResults({
  results,
  loading,
  onRetry,
}: {
  results: Product[];
  loading: boolean;
  onRetry: () => void;
}) {
  const { t } = useVoiceCart();

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <ResultSkeleton />
        <ResultSkeleton />
        <ResultSkeleton />
        <ResultSkeleton />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="glass flex flex-col items-center rounded-3xl px-6 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-glass text-muted-foreground">
          <PackageSearch className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <h3 className="mt-4 text-base font-semibold">{t("noResultsTitle")}</h3>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{t("noResultsSub")}</p>
        <button
          onClick={onRetry}
          className="mt-5 rounded-full border border-border-strong bg-glass-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          {t("tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      key={results.map((product) => product.id).join("-")}
      variants={staggerParent(0.05)}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2"
    >
      {results.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
}
