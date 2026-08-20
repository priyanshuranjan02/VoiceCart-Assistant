import { AnimatePresence, motion } from "motion/react";
import { Check, Edit3, RotateCcw, Sparkles, Trash2 } from "lucide-react";

import { springs } from "@/lib/voicecart/motion";
import { useVoiceCart, type Activity } from "@/lib/voicecart/store";

const relative = (at: number) => {
  const minutes = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const iconFor = (kind: Activity["kind"]) => {
  switch (kind) {
    case "search":
      return RotateCcw;
    case "remove":
    case "clear":
      return Trash2;
    case "update":
      return Edit3;
    case "suggest":
      return Sparkles;
    case "complete":
    case "add":
    default:
      return Check;
  }
};

export function RecentActivity({ limit = 6 }: { limit?: number }) {
  const { activity, t } = useVoiceCart();

  return (
    <section className="glass rounded-3xl p-4 sm:p-5" aria-label={t("recentActivity")}>
      <h2 className="text-sm font-semibold">{t("recentActivity")}</h2>
      <ul className="mt-3 space-y-1">
        <AnimatePresence initial={false}>
          {activity.slice(0, limit).map((entry) => {
            const Icon = iconFor(entry.kind);
            return (
              <motion.li
                key={entry.id}
                layout="position"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={springs.ui}
                className="flex items-center gap-2.5 rounded-lg px-1.5 py-2"
              >
                <span
                  className={
                    "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border " +
                    (entry.kind === "remove" || entry.kind === "clear"
                      ? "bg-destructive/12 text-destructive"
                      : entry.kind === "search"
                        ? "bg-accent/12 text-accent"
                        : entry.kind === "update"
                          ? "bg-primary/12 text-primary"
                          : "bg-success/12 text-success")
                  }
                >
                  <Icon className="h-3 w-3" strokeWidth={2.4} />
                </span>
                <p className="min-w-0 flex-1 truncate text-xs text-foreground/90">{entry.label}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {relative(entry.at)}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}
