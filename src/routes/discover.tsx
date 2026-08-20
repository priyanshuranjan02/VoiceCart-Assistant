import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { z } from "zod";

import { AppShell } from "@/components/voicecart/AppShell";
import { VoiceSearch } from "@/components/voicecart/VoiceSearch";
import { SmartSuggestions } from "@/components/voicecart/SmartSuggestions";
import { enter, staggerParent } from "@/lib/voicecart/motion";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/discover")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Discover Products — VoiceCart" },
      {
        name: "description",
        content:
          "Search groceries with your voice on VoiceCart. Filter by brand, price and organic, and see extracted filters from natural language.",
      },
      { property: "og:title", content: "Discover Products — VoiceCart" },
      {
        property: "og:description",
        content: "Voice product search with brand, price and organic filters.",
      },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { q } = Route.useSearch();

  return (
    <AppShell>
      <motion.div
        variants={staggerParent(0.08)}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-4xl space-y-8"
      >
        <motion.div variants={enter}>
          <VoiceSearch initialQuery={q ?? ""} />
        </motion.div>
        <motion.div variants={enter}>
          <SmartSuggestions />
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
