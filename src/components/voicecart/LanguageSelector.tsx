import { motion } from "motion/react";

import { useVoiceCart } from "@/lib/voicecart/store";
import { springs } from "@/lib/voicecart/motion";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { code: "en", label: "EN", full: "English" },
  { code: "hi", label: "हिं", full: "Hindi" },
] as const;

export function LanguageSelector() {
  const { lang, setLang } = useVoiceCart();

  return (
    <div
      role="group"
      aria-label="Interface language"
      className="relative flex items-center gap-0.5 rounded-full border border-border bg-glass p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          onClick={() => setLang(option.code)}
          aria-pressed={lang === option.code}
          aria-label={`Switch to ${option.full}`}
          className={cn(
            "relative rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            lang === option.code
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {lang === option.code && (
            <motion.span
              layoutId="lang-pill"
              transition={springs.ui}
              className="absolute inset-0 rounded-full bg-primary/25"
            />
          )}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
