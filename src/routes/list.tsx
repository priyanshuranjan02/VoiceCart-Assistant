import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/voicecart/AppShell";
import { ShoppingList } from "@/components/voicecart/ShoppingList";
import { SmartSuggestions } from "@/components/voicecart/SmartSuggestions";
import { enter, staggerParent } from "@/lib/voicecart/motion";
import { useVoiceCart } from "@/lib/voicecart/store";

export const Route = createFileRoute("/list")({
  head: () => ({
    meta: [
      { title: "Shopping List — VoiceCart" },
      {
        name: "description",
        content:
          "Your VoiceCart shopping list, automatically grouped by category with quantities, completion progress and voice-driven edits.",
      },
      { property: "og:title", content: "Shopping List — VoiceCart" },
      {
        property: "og:description",
        content: "Categorised shopping list with quantity management and voice-driven edits.",
      },
    ],
  }),
  component: ListPage,
});

function ListPage() {
  const { t, items } = useVoiceCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const done = items.filter((item) => item.done).length;

  return (
    <AppShell>
      <motion.div
        variants={staggerParent(0.08)}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-3xl space-y-6"
      >
        <motion.header variants={enter} className="px-1">
          <h1 className="text-2xl font-semibold">{t("shoppingList")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} {t("items")} · {done} {t("completed")} · edit by voice or by hand
          </p>
        </motion.header>

        <motion.div variants={enter}>
          <ShoppingList loading={loading} hideHeader />
        </motion.div>

        <motion.div variants={enter}>
          <SmartSuggestions loading={loading} />
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
