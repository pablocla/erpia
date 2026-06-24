import * as React from "react"

export const MOBILE_BREAKPOINT = 768
export const COMPACT_SHELL_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/** Móvil + tablet portrait/small landscape — shell compacto con bottom nav */
export function useCompactShell() {
  const [compact, setCompact] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_SHELL_BREAKPOINT - 1}px)`)
    const onChange = () => setCompact(window.innerWidth < COMPACT_SHELL_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setCompact(window.innerWidth < COMPACT_SHELL_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!compact
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(false)

  React.useEffect(() => {
    const onChange = () => {
      const w = window.innerWidth
      setIsTablet(w >= MOBILE_BREAKPOINT && w < COMPACT_SHELL_BREAKPOINT)
    }
    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${COMPACT_SHELL_BREAKPOINT - 1}px)`,
    )
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isTablet
}