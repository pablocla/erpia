import { cn } from "@/lib/utils"
import { brandByLine } from "@/lib/brand"
import { CLAVER_GROUP, CLAVERP_PRODUCT, CLAVERGROW_PRODUCT } from "@/lib/marketing/brand-system"

interface BrandLogoProps {
  variant?: "group" | "claverp" | "clavergrow" | "group-full" | "claverp-full" | "clavergrow-full"
  size?: "sm" | "md" | "lg"
  theme?: "light" | "dark"
  className?: string
  showByClaver?: boolean
}

const sizes = {
  sm: { icon: 28, text: "text-base", sub: "text-[9px]" },
  md: { icon: 36, text: "text-lg", sub: "text-[10px]" },
  lg: { icon: 48, text: "text-2xl", sub: "text-xs" },
}

/** Isotipo Claver — C con línea vertical */
export function ClaverIcon({
  size = 36,
  theme = "dark",
  className,
}: {
  size?: number
  theme?: "light" | "dark"
  className?: string
}) {
  const stroke = theme === "dark" ? "#F8FAFC" : "#0F172A"
  const blueLine = "#3B82F6"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M 28 14 L 14 14 L 14 34 L 28 34"
        stroke={stroke}
        strokeWidth="4.5"
        fill="none"
      />
      <path
        d="M 36 10 L 36 38"
        stroke={blueLine}
        strokeWidth="4.5"
      />
    </svg>
  )
}

// ClavERPIcon and ClavergrowIcon removed to simplify branding to the core C I logo.
export function BrandLogo({
  variant = "group-full",
  size = "md",
  theme = "dark",
  className,
  showByClaver = true,
}: BrandLogoProps) {
  const s = sizes[size]
  const textColor = theme === "dark" ? "text-white" : "text-slate-900"
  const subColor = theme === "dark" ? "text-slate-400" : "text-slate-500"

  const isClaverp = variant === "claverp" || variant === "claverp-full"
  const isClavergrow = variant === "clavergrow" || variant === "clavergrow-full"
  const isIconOnly = variant === "group" || variant === "claverp" || variant === "clavergrow"

  if (isIconOnly) {
    return <ClaverIcon size={s.icon} theme={theme} className={className} />
  }

  const Icon = ClaverIcon
  const name = isClavergrow
    ? CLAVERGROW_PRODUCT.name
    : isClaverp
      ? CLAVERP_PRODUCT.name
      : CLAVER_GROUP.name
  const sub = isClavergrow
    ? CLAVERGROW_PRODUCT.descriptor
    : isClaverp
      ? CLAVERP_PRODUCT.descriptor
      : CLAVER_GROUP.descriptor
  const tagline = isClavergrow
    ? CLAVERGROW_PRODUCT.tagline
    : isClaverp
      ? CLAVERP_PRODUCT.tagline
      : CLAVER_GROUP.tagline
  const parentLine = brandByLine(name)

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Icon size={s.icon} theme={theme} />
      <div className="min-w-0 leading-none">
        <div className={cn("font-[var(--font-fraunces)] font-semibold tracking-tight", s.text, textColor)}>
          {name}
        </div>
        {size !== "sm" && (
          <div className={cn("mt-0.5 max-w-[220px] truncate", s.sub, subColor)}>
            {(isClaverp || isClavergrow) && showByClaver && parentLine ? (
              <span>
                {parentLine}
                <span className="hidden sm:inline"> · {tagline}</span>
              </span>
            ) : (
              isClaverp || isClavergrow ? tagline : sub
            )}
          </div>
        )}
      </div>
    </div>
  )
}