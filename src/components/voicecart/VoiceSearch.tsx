import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { VoiceButton } from "./VoiceButton";
import { SearchResults } from "./SearchResults";
import { PRODUCTS, SEARCH_FILTERS, type Product, type SearchFilter } from "@/lib/voicecart/data";
import { chipEnter, springs, staggerParent } from "@/lib/voicecart/motion";
import { parseCommand } from "@/lib/voicecart/nlp";
import { useVoiceCart } from "@/lib/voicecart/store";
import { useVoiceSession } from "@/lib/voicecart/useVoiceSession";
import { cn } from "@/lib/utils";
import { ProductSearchEngine } from "@/services/search/searchEngine";

const BRANDS = ["All brands", ...new Set(PRODUCTS.map((product) => product.brand))];

export function VoiceSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const { t, logSearch } = useVoiceCart();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>("All");
  const [brand, setBrand] = useState(BRANDS[0]);
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<string[]>([]);

  const runSearch = useCallback(
    (text: string) => {
      const parsed = parseCommand(text);
      setQuery(text);
      setEntities(parsed.attributes);

      if (parsed.maxPrice) {
        setFilter("Under ₹200");
      }
      if (parsed.attributes.includes("Organic")) {
        setFilter("Organic");
      }
      if (parsed.brand) {
        setBrand(parsed.brand);
      }

      setLoading(true);
      logSearch(parsed.item ?? text);
      const timer = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(timer);
    },
    [logSearch],
  );

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery);
    }
  }, [initialQuery, runSearch]);

  const { status, transcript, start } = useVoiceSession({
    onCommand: (parsed) => {
      runSearch(parsed.transcript);
      return `Searching for ${parsed.item ?? parsed.transcript}`;
    },
  });

  const results = useMemo<Product[]>(() => {
    return ProductSearchEngine.search(PRODUCTS, {
      query,
      brand,
      filter,
    });
  }, [query, filter, brand]);

  return (
    <section className="space-y-5" aria-label={t("findSomething")}>
      <header className="px-1">
        <h2 className="text-xl font-semibold">{t("findSomething")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("findSomethingSub")}</p>
      </header>

      <div className="glass rounded-3xl p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <Search className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
          <label htmlFor="vc-search" className="sr-only">
            {t("findSomething")}
          </label>
          <input
            id="vc-search"
            value={status === "listening" ? transcript : query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch(query);
            }}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <VoiceButton size="sm" status={status} onClick={() => start()} label="Search by voice" />
        </div>

        <AnimatePresence>
          {status === "listening" && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden pl-8 text-xs text-primary"
            >
              {t("listening")}
            </motion.p>
          )}
        </AnimatePresence>

        {entities.length > 0 && (
          <motion.ul
            variants={staggerParent(0.06)}
            initial="hidden"
            animate="show"
            className="mt-3.5 flex flex-wrap gap-2 border-t border-border pt-3.5"
          >
            {entities.map((entity) => (
              <motion.li key={entity} variants={chipEnter}>
                <span className="rounded-full border border-primary/30 bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-foreground">
                  {entity}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      <div className="space-y-3">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {SEARCH_FILTERS.map((option) => (
            <motion.button
              key={option}
              whileTap={{ scale: 0.96 }}
              transition={springs.snap}
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === option
                  ? "border-primary/50 bg-primary/20 text-foreground"
                  : "border-border bg-glass text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </motion.button>
          ))}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {BRANDS.slice(0, 8).map((option) => (
            <button
              key={option}
              onClick={() => setBrand(option)}
              aria-pressed={brand === option}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors",
                brand === option
                  ? "border-accent/50 bg-accent/15 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        {results.length} {t("results")}
      </p>

      <SearchResults
        results={results}
        loading={loading}
        onRetry={() => {
          setFilter("All");
          setBrand(BRANDS[0]);
          setQuery("");
          setEntities([]);
        }}
      />
    </section>
  );
}
