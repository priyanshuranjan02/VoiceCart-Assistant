import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

import { springs } from "@/lib/voicecart/motion";
import { useTheme } from "@/lib/voicecart/theme";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "light", icon: Sun, label: "Light" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="relative flex items-center gap-0.5 rounded-full border border-border bg-glass p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
          aria-label={`Switch to ${option.label} mode`}
          className={cn(
            "relative rounded-full px-2.5 py-1 transition-colors",
            theme === option.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {theme === option.value && (
            <motion.span
              layoutId="theme-pill"
              transition={springs.ui}
              className="absolute inset-0 rounded-full bg-primary/25"
            />
          )}
          <option.icon className="relative h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
