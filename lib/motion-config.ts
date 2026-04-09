import type { Transition, Variants, BezierDefinition } from "framer-motion"

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION DESIGN SYSTEM — Centralized animation constants for the ERP
   All durations, springs, and orchestration configs in one place.
   Respects `prefers-reduced-motion` via the REDUCED variants.
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Springs ────────────────────────────────────────────────────────────
export const SPRING_SMOOTH: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
}

export const SPRING_BOUNCY: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.6,
}

export const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 28,
  mass: 1,
}

// ─── Easing ─────────────────────────────────────────────────────────────
export const EASE_OUT_EXPO: BezierDefinition = [0.16, 1, 0.3, 1]

// ─── Duration helpers ───────────────────────────────────────────────────
export const DURATION_FAST = 0.15
export const DURATION_NORMAL = 0.25
export const DURATION_SLOW = 0.4

// ─── Stagger orchestration ─────────────────────────────────────────────
export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
}

export const STAGGER_FAST: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
}

// ─── Variant presets ────────────────────────────────────────────────────
export const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_SMOOTH,
  },
}

export const FADE_DOWN: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_SMOOTH,
  },
}

export const FADE_IN: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION_NORMAL },
  },
}

export const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING_BOUNCY,
  },
}

export const SLIDE_LEFT: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING_SMOOTH,
  },
}

export const SLIDE_RIGHT: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING_SMOOTH,
  },
}

// ─── Interactive presets ────────────────────────────────────────────────
export const SCALE_TAP = { scale: 0.97 }
export const SCALE_TAP_SM = { scale: 0.985 }

export const HOVER_LIFT = {
  y: -2,
  transition: SPRING_SMOOTH,
}

export const HOVER_GLOW = {
  boxShadow: "0 8px 30px -10px var(--shadow-soft)",
  y: -2,
  transition: SPRING_SMOOTH,
}

// ─── Page transition ────────────────────────────────────────────────────
export const PAGE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_NORMAL,
      ease: EASE_OUT_EXPO,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION_FAST },
  },
}

// ─── Number counter ─────────────────────────────────────────────────────
export const NUMBER_SPRING: Transition = {
  type: "spring",
  stiffness: 80,
  damping: 20,
  mass: 1,
}

// ─── Reduced motion fallbacks ───────────────────────────────────────────
export const REDUCED_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
}

export const REDUCED_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
}
