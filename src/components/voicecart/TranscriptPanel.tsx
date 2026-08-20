import { AnimatePresence, motion } from "motion/react";

import { chipEnter, springs, staggerParent } from "@/lib/voicecart/motion";
import { formatQuantity, type ParsedCommand } from "@/lib/voicecart/nlp";
import { useVoiceCart } from "@/lib/voicecart/store";
import type { VoiceStatus } from "@/lib/voicecart/useVoiceSession";

type Props = {
  status: VoiceStatus;
  transcript: string;
  parsed: ParsedCommand | null;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function TranscriptPanel({ status, transcript, parsed }: Props) {
  const { t } = useVoiceCart();
  if (!transcript) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.ui}
      className="glass-subtle mt-6 w-full rounded-2xl p-4 sm:p-5"
    >
      <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
        {t("youSaid")}
      </p>
      <p className="mt-1.5 text-base font-medium text-foreground sm:text-lg">
        “{transcript}
        {status === "listening" && (
          <motion.span
            aria-hidden
            className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary"
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        ”
      </p>

      <AnimatePresence>
        {parsed && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.ui}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <Field label={t("action")} value={parsed.action.toUpperCase()} />
              <Field label={t("item")} value={parsed.item ?? "—"} />
              <Field label={t("quantity")} value={formatQuantity(parsed.quantity, parsed.unit)} />
            </div>

            {parsed.attributes.length > 0 && (
              <motion.ul
                variants={staggerParent(0.06)}
                initial="hidden"
                animate="show"
                className="mt-4 flex flex-wrap gap-2"
              >
                <motion.li variants={chipEnter}>
                  <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground">
                    {parsed.action.toUpperCase()}
                  </span>
                </motion.li>
                {parsed.attributes.map((attr) => (
                  <motion.li key={attr} variants={chipEnter}>
                    <span className="rounded-full border border-border-strong bg-glass-strong px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {attr}
                    </span>
                  </motion.li>
                ))}
                {parsed.quantity && parsed.action === "add" && (
                  <motion.li variants={chipEnter}>
                    <span className="rounded-full border border-border-strong bg-glass-strong px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {formatQuantity(parsed.quantity, parsed.unit)}
                    </span>
                  </motion.li>
                )}
              </motion.ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
