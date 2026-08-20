import { AnimatePresence, motion } from "motion/react";
import { Mic, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { ShoppingListItem } from "./ShoppingListItem";
import { AddItemDialog } from "./AddItemDialog";
import { CATEGORIES, type Category, type ListItem } from "@/lib/voicecart/data";
import { springs } from "@/lib/voicecart/motion";
import { useVoiceCart } from "@/lib/voicecart/store";

function CategoryGroup({ category, items }: { category: Category; items: ListItem[] }) {
  const { toggleItem, removeItem, setQuantity } = useVoiceCart();

  return (
    <motion.section layout className="pt-1">
      <div className="flex items-center gap-2 px-2">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
          {category.toUpperCase()}
        </h3>
        <span className="text-[11px] text-muted-foreground/70">{items.length}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <motion.ul layout className="mt-1.5 space-y-0.5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ShoppingListItem
              key={item.id}
              item={item}
              onToggle={() => toggleItem(item.id)}
              onRemove={() => removeItem(item.id)}
              onQuantity={(quantity) => setQuantity(item.id, quantity)}
            />
          ))}
        </AnimatePresence>
      </motion.ul>
    </motion.section>
  );
}

function EmptyList({ onAdd }: { onAdd: () => void }) {
  const { t } = useVoiceCart();
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-glass text-primary">
        <Mic className="h-7 w-7" strokeWidth={1.6} />
      </div>
      <h3 className="mt-5 text-base font-semibold">{t("emptyListTitle")}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{t("emptyListSub")}</p>
      <button
        onClick={onAdd}
        className="mt-5 rounded-full bg-gradient-accent px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
      >
        {t("startSpeaking")}
      </button>
    </div>
  );
}

export function ShoppingList({
  loading = false,
  hideHeader = false,
}: {
  loading?: boolean;
  hideHeader?: boolean;
}) {
  const { items, t } = useVoiceCart();
  const [dialogOpen, setDialogOpen] = useState(false);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        items: items.filter((item) => item.category === category),
      })).filter((group) => group.items.length > 0),
    [items],
  );

  const done = items.filter((item) => item.done).length;
  const progress = items.length ? (done / items.length) * 100 : 0;

  return (
    <motion.div layout className="glass rounded-3xl p-4 sm:p-6">
      {!hideHeader ? (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{t("shoppingList")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {items.length} {t("items")} · {done} {t("completed")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-secondary sm:block"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Shopping list progress"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-accent"
                animate={{ width: `${progress}%` }}
                transition={springs.gentle}
              />
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-border-strong bg-glass px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("addItem")}
            </button>
          </div>
        </header>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border-strong bg-glass px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addItem")}
          </button>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {loading ? (
          <ul className="space-y-3" aria-hidden>
            {[0, 1, 2, 3, 4].map((row) => (
              <li key={row} className="flex items-center gap-3 px-2">
                <div className="h-6 w-6 animate-pulse rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                  <div className="h-2.5 w-1/5 animate-pulse rounded bg-secondary/70" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyList onAdd={() => setDialogOpen(true)} />
        ) : (
          <AnimatePresence initial={false}>
            {grouped.map((group) => (
              <CategoryGroup key={group.category} category={group.category} items={group.items} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <AddItemDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  );
}
