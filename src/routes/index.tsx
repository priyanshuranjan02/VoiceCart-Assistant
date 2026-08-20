import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { AppShell } from "@/components/voicecart/AppShell";
import { VoiceCommandCenter } from "@/components/voicecart/VoiceCommandCenter";
import { ShoppingList } from "@/components/voicecart/ShoppingList";
import { SmartSuggestions } from "@/components/voicecart/SmartSuggestions";
import { RecentActivity } from "@/components/voicecart/RecentActivity";
import { enter, staggerParent } from "@/lib/voicecart/motion";
import { useVoiceCart } from "@/lib/voicecart/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceCart — Talk to your shopping list" },
      {
        name: "description",
        content:
          "VoiceCart is a voice-first shopping assistant: speak to add, remove and find groceries, with smart, seasonal and substitute recommendations.",
      },
      { property: "og:title", content: "VoiceCart — Talk to your shopping list" },
      {
        property: "og:description",
        content:
          "A calm, voice-first assistant for groceries. Speak naturally to manage your list, in English or Hindi.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useVoiceCart();

  return (
    <AppShell>
      <motion.div
        variants={staggerParent(0.08)}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-5xl space-y-6"
      >
        <motion.header variants={enter} className="px-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("greeting")}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t("greetingSub")}</p>
        </motion.header>

        <motion.div variants={enter}>
          <VoiceCommandCenter />
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <motion.div variants={enter}>
            <ShoppingList />
          </motion.div>
          <motion.div variants={enter}>
            <RecentActivity />
          </motion.div>
        </div>

        <motion.div variants={enter}>
          <SmartSuggestions />
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
