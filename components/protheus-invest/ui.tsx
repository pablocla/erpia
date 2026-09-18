import { cn } from "@/lib/utils"

export function PiCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card text-card-foreground", className)}
      {...props}
    />
  )
}

export function PiBadge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: "neutral" | "ok" | "warn" | "bad" | "info" }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    ok: "bg-[oklch(0.45_0.12_145/0.16)] text-[oklch(0.72_0.14_145)]",
    warn: "bg-[oklch(0.65_0.12_80/0.16)] text-[oklch(0.78_0.12_80)]",
    bad: "bg-destructive/16 text-destructive",
    info: "bg-[oklch(0.55_0.1_185/0.16)] text-[oklch(0.68_0.1_185)]",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

export function PiInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring",
        className,
      )}
      {...props}
    />
  )
}

export function PiButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50",
        size === "sm" ? "h-8 px-3" : "h-10 px-4",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "border border-border bg-secondary text-secondary-foreground hover:bg-accent",
        variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  )
}

export const SELECT_CLS =
  "h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm text-foreground"
