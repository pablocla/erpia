"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getPosDeviceProfile,
  mergePosLayoutOverrides,
  resolvePosLayout,
  type PosDeviceProfile,
  type PosLayoutConfig,
  type PosModoLayout,
} from "@/lib/pos/pos-layout-config"
import { POS_MOBILE_BREAKPOINT, POS_DESKTOP_BREAKPOINT } from "@/lib/pos/pos-layout-config"

export function usePosLayout(
  modo: PosModoLayout = "mostrador",
  overrides?: Partial<PosLayoutConfig>,
) {
  const [profile, setProfile] = useState<PosDeviceProfile>(() =>
    typeof window !== "undefined" ? getPosDeviceProfile(window.innerWidth) : "desktop",
  )
  const [ready, setReady] = useState(() => typeof window !== "undefined")

  useEffect(() => {
    const update = () => {
      setProfile(getPosDeviceProfile(window.innerWidth))
      setReady(true)
    }
    update()

    const queries = [
      window.matchMedia(`(max-width: ${POS_MOBILE_BREAKPOINT - 1}px)`),
      window.matchMedia(
        `(min-width: ${POS_MOBILE_BREAKPOINT}px) and (max-width: ${POS_DESKTOP_BREAKPOINT - 1}px)`,
      ),
      window.matchMedia(`(min-width: ${POS_DESKTOP_BREAKPOINT}px)`),
    ]
    for (const mql of queries) mql.addEventListener("change", update)
    window.addEventListener("resize", update)
    return () => {
      for (const mql of queries) mql.removeEventListener("change", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const layout = useMemo(() => {
    const base = resolvePosLayout(profile, modo)
    return overrides ? mergePosLayoutOverrides(base, overrides) : base
  }, [profile, modo, overrides])

  return {
    layout,
    profile,
    ready,
    isMobile: profile === "mobile",
    isTablet: profile === "tablet",
    isDesktop: profile === "desktop",
    isCompact: profile !== "desktop",
  }
}