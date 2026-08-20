import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { AppShell } from "@/components/voicecart/AppShell";
import { RecentActivity } from "@/components/voicecart/RecentActivity";
import { enter, staggerParent } from "@/lib/voicecart/motion";
import { useVoiceCart } from "@/lib/voicecart/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Command History — VoiceCart" },
      {
        name: "description",
        content:
          "Review every VoiceCart voice command: items added, removed, completed and products you searched for, with timestamps.",
      },
      { property: "og:title", content: "Command History — VoiceCart" },
      {
        property: "og:description",
        content: "A timestamped log of your voice commands and list changes.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t, activity } = useVoiceCart();

  return (
    <AppShell>
      <motion.div
        variants={staggerParent(0.08)}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-2xl space-y-6"
      >
        <motion.header variants={enter} className="px-1">
          <h1 className="text-2xl font-semibold">{t("history")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activity.length} recorded voice interactions
          </p>
        </motion.header>

        <motion.div variants={enter}>
          <RecentActivity limit={12} />
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
