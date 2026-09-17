import { cn } from "@/lib/utils"

export function PiCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-[rgb(232_238_242/0.1)] bg-[#121c26]", className)}
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
    neutral: "bg-[#1e2d3b] text-[#8fa3b3]",
    ok: "bg-[rgb(125_186_122/0.14)] text-[#7dba7a]",
    warn: "bg-[rgb(212_164_90/0.16)] text-[#d4a45a]",
    bad: "bg-[rgb(208_112_112/0.16)] text-[#d07070]",
    info: "bg-[rgb(61_155_143/0.16)] text-[#3d9b8f]",
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
        "h-10 w-full rounded-md border border-[rgb(232_238_242/0.1)] bg-[#182430] px-3 text-sm text-[#e8eef2] outline-none placeholder:text-[#6b7f90] focus:border-[#3d9b8f]",
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
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium disabled:opacity-50",
        size === "sm" ? "h-8 px-3" : "h-10 px-4",
        variant === "primary" && "bg-[#3d9b8f] text-[#07120f] hover:bg-[#4aaea1]",
        variant === "secondary" && "border border-[rgb(232_238_242/0.1)] bg-[#1e2d3b] text-[#e8eef2] hover:bg-[#243644]",
        variant === "ghost" && "text-[#8fa3b3] hover:bg-[#1e2d3b] hover:text-[#e8eef2]",
        className,
      )}
      {...props}
    />
  )
}

export const SELECT_CLS =
  "h-10 w-full rounded-md border border-[rgb(232_238_242/0.1)] bg-[#182430] px-3 text-sm text-[#e8eef2]"
