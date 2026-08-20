import type { Transition, Variants } from "motion/react";

/**
 * Purpose-specific spring transitions (Motion UI philosophy).
 * Use the smallest one that communicates the change.
 */
export const springs = {
  /** button presses, checkbox, tiny feedback */
  snap: { type: "spring", stiffness: 700, damping: 34, mass: 0.6 } satisfies Transition,
  /** dropdowns, dialogs, cards appearing */
  ui: { type: "spring", stiffness: 420, damping: 32, mass: 0.8 } satisfies Transition,
  /** large panels, page transitions */
  gentle: { type: "spring", stiffness: 190, damping: 26, mass: 1 } satisfies Transition,
  /** celebratory feedback */
  lively: { type: "spring", stiffness: 520, damping: 18, mass: 0.7 } satisfies Transition,
  /** ambient background motion only */
  ambient: { duration: 6, ease: "easeInOut", repeat: Infinity } satisfies Transition,
};

export const enter: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: springs.gentle },
};

export const staggerParent = (stagger = 0.07): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: 0.04 } },
});

export const chipEnter: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: springs.ui },
};
