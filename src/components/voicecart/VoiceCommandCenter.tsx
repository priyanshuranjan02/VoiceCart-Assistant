import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

import { VoiceButton } from "./VoiceButton";
import { TranscriptPanel } from "./TranscriptPanel";
import { VOICE_EXAMPLES, findProductByName } from "@/lib/voicecart/data";
import { springs } from "@/lib/voicecart/motion";
import type { ParsedCommand } from "@/lib/voicecart/nlp";
import { useVoiceCart } from "@/lib/voicecart/store";
import { useVoiceSession } from "@/lib/voicecart/useVoiceSession";
import { useMicAvailability } from "@/lib/voicecart/useMicAvailability";
import { inferCategory } from "@/services/shopping/categorizer";

export function VoiceCommandCenter({ micAvailable }: { micAvailable?: boolean }) {
  const detectedMic = useMicAvailability();
  const micReady = micAvailable ?? detectedMic;
  const { t, addItem, removeByName, updateQuantity, items, toggleItem, clearList, logSearch } =
    useVoiceCart();
  const navigate = useNavigate();

  const handleCommand = useCallback(
    (parsed: ParsedCommand): string | null => {
      const itemTarget = parsed.item ?? parsed.product;

      // 1. ADD COMMAND
      if (parsed.action === "add" && itemTarget) {
        const product = findProductByName(itemTarget);
        const quantity = parsed.quantity ?? 1;
        const name = product ? product.name : itemTarget.replace(/^\w/, (c) => c.toUpperCase());
        const category = product ? product.category : (parsed.category ?? inferCategory(name));
        const unit = parsed.unit ?? product?.unit ?? "pieces";

        addItem({
          name,
          category,
          quantity,
          unit,
          brand: product?.brand,
          price: product?.price,
        });

        return `Added ${quantity} ${unit} of ${name}`;
      }

      // 2. REMOVE COMMAND
      if (parsed.action === "remove" && itemTarget) {
        const removed = removeByName(itemTarget);
        return removed
          ? `Removed ${itemTarget} from your list`
          : `Could not find ${itemTarget} in your list`;
      }

      // 3. UPDATE QUANTITY COMMAND
      if (parsed.action === "update" && itemTarget && parsed.quantity) {
        const updated = updateQuantity(itemTarget, parsed.quantity);
        return updated
          ? `Updated ${itemTarget} quantity to ${parsed.quantity}`
          : `Could not find ${itemTarget} in your list to update`;
      }

      // 4. COMPLETE / CHECK OFF COMMAND
      if (parsed.action === "complete" && itemTarget) {
        const target = items.find((i) => i.name.toLowerCase().includes(itemTarget.toLowerCase()));
        if (target) {
          if (!target.done) toggleItem(target.id);
          return `Marked ${target.name} as completed`;
        }
        return `Could not find ${itemTarget} in your list`;
      }

      // 5. CLEAR COMMAND
      if (parsed.action === "clear") {
        clearList();
        return "Cleared your shopping list";
      }

      // 6. SEARCH COMMAND
      if (parsed.action === "search") {
        const query = itemTarget ?? parsed.transcript;
        logSearch(query);
        navigate({ to: "/discover", search: { q: query } });
        return `Searching for ${query}`;
      }

      // 7. RECOMMEND / SUGGEST COMMAND
      if (parsed.action === "suggest") {
        return "Here are a few smart suggestions based on your habits";
      }

      return null;
    },
    [addItem, removeByName, updateQuantity, items, toggleItem, clearList, logSearch, navigate],
  );

  const { status, transcript, parsed, message, start, reset } = useVoiceSession({
    onCommand: handleCommand,
  });

  const statusLabel =
    status === "listening"
      ? t("listening")
      : status === "processing"
        ? t("processing")
        : status === "success"
          ? (message ?? "Done")
          : status === "error"
            ? t("notUnderstood")
            : t("readyToListen");

  if (!micReady) {
    return (
      <section className="glass rounded-3xl p-6 text-center sm:p-10">
        <VoiceButton status="idle" onClick={() => {}} label={t("micUnavailable")} disabled />
        <h2 className="mt-6 text-lg font-semibold">{t("micUnavailable")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Allow microphone access in your browser settings to talk to VoiceCart. You can still add
          items manually.
        </p>
      </section>
    );
  }

  return (
    <motion.section
      layout
      className="glass relative overflow-hidden rounded-3xl p-5 sm:p-8"
      aria-label="Voice command center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[90px]"
      />

      <div className="relative flex flex-col items-center text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={statusLabel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={springs.ui}
            className={
              "text-[10px] font-semibold tracking-[0.18em] " +
              (status === "success"
                ? "text-success"
                : status === "error"
                  ? "text-destructive"
                  : "text-muted-foreground")
            }
          >
            {statusLabel.toUpperCase()}
          </motion.p>
        </AnimatePresence>

        <h1 className="mt-3 text-balance text-2xl font-semibold sm:text-3xl">{t("heroPrompt")}</h1>

        <div className="mt-7">
          <VoiceButton
            status={status}
            onClick={() => start()}
            label={status === "listening" ? "Stop listening" : "Start voice command"}
          />
        </div>

        {status === "error" && (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.ui}
            onClick={() => start()}
            className="mt-5 rounded-full border border-border-strong bg-glass-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            {t("tryAgain")}
          </motion.button>
        )}

        <TranscriptPanel status={status} transcript={transcript} parsed={parsed} />

        <div className="mt-6 w-full">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("trySaying")}
          </p>
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {VOICE_EXAMPLES.map((example) => (
              <motion.button
                key={example}
                whileTap={{ scale: 0.96 }}
                transition={springs.snap}
                onClick={() => {
                  reset();
                  start(example);
                }}
                className="shrink-0 rounded-full border border-border bg-glass px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                “{example}”
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
