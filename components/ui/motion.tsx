"use client"

import React, { useEffect, useRef } from "react"
import {
  motion,
  useReducedMotion,
  useInView,
  useSpring,
  useTransform,
  useMotionValue,
  AnimatePresence,
  type HTMLMotionProps,
} from "framer-motion"
import {
  SPRING_SMOOTH,
  STAGGER_CONTAINER,
  STAGGER_FAST,
  FADE_UP,
  FADE_DOWN,
  SCALE_IN,
  PAGE_VARIANTS,
  NUMBER_SPRING,
  REDUCED_VARIANTS,
  REDUCED_CONTAINER,
  SCALE_TAP,
  HOVER_LIFT,
} from "@/lib/motion-config"

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION PRIMITIVES — Reusable animated wrappers for the entire ERP
   All components respect prefers-reduced-motion automatically.
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── MotionCard ─────────────────────────────────────────────────────────
// Wraps any content with fade-up + optional hover lift. Use inside a
// MotionList for automatic stagger, or standalone.
interface MotionCardProps extends HTMLMotionProps<"div"> {
  hover?: boolean
}

export function MotionCard({
  children,
  hover = false,
  className,
  ...props
}: MotionCardProps) {
  const reduced = useReducedMotion()
  const variants = reduced ? REDUCED_VARIANTS : FADE_UP

  return (
    <motion.div
      variants={variants}
      whileHover={hover && !reduced ? HOVER_LIFT : undefined}
      whileTap={hover && !reduced ? SCALE_TAP : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── MotionList ─────────────────────────────────────────────────────────
// Container that staggers its children. Use with MotionCard or MotionListItem.
interface MotionListProps extends HTMLMotionProps<"div"> {
  fast?: boolean
}

export function MotionList({
  children,
  fast = false,
  className,
  ...props
}: MotionListProps) {
  const reduced = useReducedMotion()
  const containerVariants = reduced
    ? REDUCED_CONTAINER
    : fast
      ? STAGGER_FAST
      : STAGGER_CONTAINER

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── MotionListItem ─────────────────────────────────────────────────────
// Generic child element for MotionList. Use for table rows, list items, etc.
export function MotionListItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      variants={reduced ? REDUCED_VARIANTS : FADE_UP}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── MotionNumber ───────────────────────────────────────────────────────
// Animated counter that springs from 0 to target value. Perfect for KPIs.
interface MotionNumberProps {
  value: number
  format?: (n: number) => string
  className?: string
}

export function MotionNumber({
  value,
  format = (n) => n.toLocaleString("es-AR"),
  className,
}: MotionNumberProps) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, NUMBER_SPRING)
  const display = useTransform(spring, (v) => format(Math.round(v)))

  useEffect(() => {
    motionValue.set(reduced ? value : 0)
    if (!reduced) {
      // Small delay ensures mount animation is visible
      const timer = setTimeout(() => motionValue.set(value), 50)
      return () => clearTimeout(timer)
    }
  }, [value, reduced, motionValue])

  // Update DOM directly to avod re-renders on every spring frame
  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsubscribe
  }, [display])

  return (
    <span ref={ref} className={className}>
      {format(reduced ? value : 0)}
    </span>
  )
}

// ─── MotionPage ─────────────────────────────────────────────────────────
// Wraps page content with enter/exit transitions. Use in layout.tsx with
// AnimatePresence or wrap individual page roots.
interface MotionPageProps extends HTMLMotionProps<"div"> {
  /** Unique key for AnimatePresence — typically the pathname */
  pageKey?: string
}

export function MotionPage({
  children,
  pageKey,
  className,
  ...props
}: MotionPageProps) {
  const reduced = useReducedMotion()
  const variants = reduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : PAGE_VARIANTS

  return (
    <motion.div
      key={pageKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── MotionPresence ─────────────────────────────────────────────────────
// Thin wrapper around AnimatePresence for convenience.
export function MotionPresence({
  children,
  mode = "wait",
}: {
  children: React.ReactNode
  mode?: "wait" | "sync" | "popLayout"
}) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>
}

// ─── ScrollReveal ───────────────────────────────────────────────────────
// Animates children when they scroll into the viewport.
interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  /** How much of the element should be visible before animating (0-1) */
  amount?: number
  /** Trigger once, or every time it enters/leaves viewport */
  once?: boolean
}

export function ScrollReveal({
  children,
  amount = 0.3,
  once = true,
  className,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { amount, once })
  const reduced = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, transition: SPRING_SMOOTH }
          : reduced
            ? { opacity: 1 }
            : { opacity: 0, y: 24 }
      }
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── MotionFadeDown ─────────────────────────────────────────────────────
// Simple fade-down entrance, ideal for page headers/banners.
export function MotionFadeDown({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      variants={reduced ? REDUCED_VARIANTS : FADE_DOWN}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── MotionScaleIn ──────────────────────────────────────────────────────
// Scale + fade entrance, ideal for modals, popovers, badges.
export function MotionScaleIn({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      variants={reduced ? REDUCED_VARIANTS : SCALE_IN}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Re-export motion for direct use when primitives aren't enough
export { motion, AnimatePresence, useReducedMotion }
