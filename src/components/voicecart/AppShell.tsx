import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AudioLines,
  Compass,
  History as HistoryIcon,
  Home,
  ListChecks,
  Search,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";

import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import { springs } from "@/lib/voicecart/motion";
import { useVoiceCart } from "@/lib/voicecart/store";
import { cn } from "@/lib/utils";

const DESKTOP_NAV = [
  { to: "/", label: "home" as const, icon: Home },
  { to: "/list", label: "list" as const, icon: ListChecks },
  { to: "/discover", label: "discover" as const, icon: Compass },
  { to: "/history", label: "history" as const, icon: HistoryIcon },
];

const MOBILE_NAV = [
  { to: "/", label: "home" as const, icon: Home },
  { to: "/list", label: "list" as const, icon: ListChecks },
  { to: "/discover", label: "search" as const, icon: Search },
  { to: "/history", label: "history" as const, icon: HistoryIcon },
];

function Logo() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-accent text-primary-foreground shadow-glow">
      <AudioLines className="h-4.5 w-4.5" strokeWidth={2} />
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, items } = useVoiceCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const pending = items.filter((item) => !item.done).length;

  return (
    <div className="app-ambient min-h-screen">
      <div className="app-grain" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-4 py-6 lg:flex">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-base font-semibold tracking-tight">VoiceCart</span>
          </Link>

          <nav className="mt-9 flex-1 space-y-1" aria-label="Main navigation">
            {DESKTOP_NAV.map((entry) => {
              const active = pathname === entry.to;
              return (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={springs.ui}
                      className="absolute inset-0 rounded-xl border border-border bg-glass"
                    />
                  )}
                  <entry.icon className="relative h-4 w-4" strokeWidth={1.9} />
                  <span className="relative">{t(entry.label)}</span>
                  {entry.to === "/list" && pending > 0 && (
                    <span className="relative ml-auto rounded-full bg-primary/25 px-1.5 py-0.5 text-[10px] font-semibold">
                      {pending}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-4 w-4" strokeWidth={1.9} />
            {t("settings")}
          </button>
        </aside>

        {/* Main workspace */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-background/60 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
                <Logo />
                <span className="truncate text-base font-semibold tracking-tight">VoiceCart</span>
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm text-muted-foreground">{t("greetingSub")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <ThemeToggle />
                <LanguageSelector />
                <span
                  aria-label="Account"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-glass text-xs font-semibold"
                >
                  P
                </span>
              </div>
            </div>
          </header>

          <main className="px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:pb-16">{children}</main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
        <div className="glass flex items-center justify-around rounded-2xl px-2 py-1.5">
          {MOBILE_NAV.map((entry) => {
            const active = pathname === entry.to;
            return (
              <Link
                key={entry.to}
                to={entry.to}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-active"
                    transition={springs.ui}
                    className="absolute inset-0 rounded-xl bg-primary/15"
                  />
                )}
                <entry.icon className="relative h-4.5 w-4.5" strokeWidth={1.9} />
                <span className="relative">{t(entry.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
