import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Mic, MicOff, TriangleAlert } from "lucide-react";

import { springs } from "@/lib/voicecart/motion";
import type { VoiceStatus } from "@/lib/voicecart/useVoiceSession";
import { cn } from "@/lib/utils";

type Props = {
  status: VoiceStatus;
  onClick: () => void;
  label: string;
  size?: "lg" | "sm";
  disabled?: boolean;
};

const BARS = [0.35, 0.7, 1, 0.55, 0.85, 0.4, 0.65];

export function VoiceButton({ status, onClick, label, size = "lg", disabled }: Props) {
  const reduced = useReducedMotion();
  const active = status === "listening";
  const dimension = size === "lg" ? "h-28 w-28 sm:h-32 sm:w-32" : "h-12 w-12";

  return (
    <div className="relative grid place-items-center">
      {/* pulsing rings while listening */}
      <AnimatePresence>
        {active &&
          !reduced &&
          [0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              aria-hidden
              className="pointer-events-none absolute rounded-full border border-primary/40"
              style={{ width: "100%", height: "100%" }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: size === "lg" ? 2.1 : 2.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, delay: ring * 0.8, ease: "easeOut" }}
            />
          ))}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "relative grid place-items-center rounded-full",
          "bg-gradient-accent text-primary-foreground",
          "ring-1 ring-inset ring-border-strong shadow-glow",
          "transition-shadow disabled:cursor-not-allowed disabled:opacity-50",
          dimension,
        )}
        whileHover={{ scale: disabled ? 1 : 1.03, transition: springs.snap }}
        whileTap={{ scale: disabled ? 1 : 0.95, transition: springs.snap }}
        animate={
          reduced || disabled
            ? { scale: 1 }
            : active
              ? {
                  scale: 1,
                  boxShadow: [
                    "0 0 0 0 transparent",
                    "0 0 44px -6px oklch(0.62 0.19 288 / 0.6)",
                    "0 0 0 0 transparent",
                  ],
                }
              : { scale: [1, 1.015, 1] }
        }
        transition={
          reduced || disabled
            ? { duration: 0.2 }
            : { duration: active ? 1.8 : 3.2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* inner glass layers */}
        <span
          aria-hidden
          className="absolute inset-[3px] rounded-full bg-background/25 backdrop-blur-sm"
        />
        <span
          aria-hidden
          className="absolute inset-[10px] rounded-full border border-primary-foreground/15"
        />

        <span className="relative grid place-items-center">
          <AnimatePresence mode="wait" initial={false}>
            {status === "listening" ? (
              <motion.span
                key="wave"
                className="flex items-end gap-[3px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={springs.ui}
              >
                {BARS.map((peak, index) => (
                  <motion.span
                    key={index}
                    className="w-[3px] rounded-full bg-primary-foreground"
                    animate={
                      reduced
                        ? { height: 14 }
                        : { height: [6, 10 + peak * (size === "lg" ? 26 : 12), 6] }
                    }
                    transition={{
                      duration: 0.9 + peak * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.06,
                    }}
                  />
                ))}
              </motion.span>
            ) : status === "processing" ? (
              <motion.span
                key="processing"
                className="relative grid h-8 w-8 place-items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-primary-foreground/25 border-t-primary-foreground"
                  animate={reduced ? {} : { rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                />
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              </motion.span>
            ) : status === "success" ? (
              <motion.span
                key="success"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={springs.lively}
              >
                <Check className={size === "lg" ? "h-10 w-10" : "h-5 w-5"} strokeWidth={2.4} />
              </motion.span>
            ) : status === "error" ? (
              <motion.span
                key="error"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={springs.ui}
              >
                <TriangleAlert className={size === "lg" ? "h-9 w-9" : "h-5 w-5"} />
              </motion.span>
            ) : disabled ? (
              <motion.span key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MicOff className={size === "lg" ? "h-9 w-9" : "h-5 w-5"} />
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={springs.ui}
              >
                <Mic className={size === "lg" ? "h-9 w-9" : "h-5 w-5"} strokeWidth={1.9} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
    </div>
  );
}
