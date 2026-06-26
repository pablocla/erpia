/**
 * Configuración paramétrica del POS por dispositivo y modo.
 * Un solo resolver alimenta page, sheet, modal cobro y QA.
 */

export const POS_MOBILE_BREAKPOINT = 768
export const POS_DESKTOP_BREAKPOINT = 1024

export const POS_BREAKPOINTS = {
  mobileMax: POS_MOBILE_BREAKPOINT - 1,
  tabletMin: POS_MOBILE_BREAKPOINT,
  desktopMin: POS_DESKTOP_BREAKPOINT,
} as const

export type PosDeviceProfile = "mobile" | "tablet" | "desktop"
export type PosModoLayout = "mostrador" | "mesa" | "kiosko"

export interface PosCarritoLayout {
  showSidePanel: boolean
  showBottomBar: boolean
  showCartSheet: boolean
  showPendientesPanel: boolean
  productosPanelClass: string
  cartPanelClass: string
}

export interface PosProductosLayout {
  gridClass: string
  cardMinHeightClass: string
  scrollPaddingClass: string
  searchInputClass: string
}

export interface PosCobroLayout {
  numpadDefaultOpen: boolean
  dialogClass: string
  medioButtonClass: string
  numpadKeyClass: string
  confirmButtonClass: string
  sheetHeightClass: string
}

export interface PosTopbarLayout {
  modeButtonClass: string
  showModeText: boolean
  showFiadoLink: boolean
  showCierreLabel: boolean
}

export interface PosUxLayout {
  hapticOnAdd: boolean
  keyboardShortcuts: boolean
  touchMinPx: number
}

export interface PosLayoutConfig {
  profile: PosDeviceProfile
  modo: PosModoLayout
  carrito: PosCarritoLayout
  productos: PosProductosLayout
  cobro: PosCobroLayout
  topbar: PosTopbarLayout
  ux: PosUxLayout
}

export function getPosDeviceProfile(width: number): PosDeviceProfile {
  if (width < POS_MOBILE_BREAKPOINT) return "mobile"
  if (width < POS_DESKTOP_BREAKPOINT) return "tablet"
  return "desktop"
}

type LayoutBase = Omit<PosLayoutConfig, "profile" | "modo">

function baseMostrador(profile: PosDeviceProfile): LayoutBase {
  const isMobile = profile === "mobile"
  const isTablet = profile === "tablet"
  const isDesktop = profile === "desktop"

  return {
    carrito: {
      showSidePanel: !isMobile,
      showBottomBar: isMobile,
      showCartSheet: isMobile,
      showPendientesPanel: isDesktop || isTablet,
      productosPanelClass: isMobile
        ? "w-full"
        : isTablet
          ? "w-[62%]"
          : "w-[60%]",
      cartPanelClass: isTablet
        ? "flex flex-col w-[38%] overflow-hidden bg-muted/30"
        : "flex flex-col w-[40%] overflow-hidden bg-muted/30",
    },
    productos: {
      gridClass: isMobile
        ? "grid-cols-2"
        : isTablet
          ? "grid-cols-3"
          : "grid-cols-4 xl:grid-cols-5",
      cardMinHeightClass: isMobile
        ? "min-h-[92px]"
        : isTablet
          ? "min-h-[88px]"
          : "min-h-[80px]",
      scrollPaddingClass: isMobile ? "pb-[4.25rem]" : "pb-3",
      searchInputClass: isMobile
        ? "h-11 text-base"
        : isTablet
          ? "h-10 text-sm"
          : "h-9 text-sm",
    },
    cobro: {
      numpadDefaultOpen: isDesktop,
      dialogClass: "flex flex-col gap-0 p-3 sm:p-4 max-w-[calc(100vw-0.75rem)] sm:max-w-sm max-h-[85dvh] overflow-hidden data-[state=open]:slide-in-from-bottom-0",
      medioButtonClass: "flex flex-col items-center py-2 rounded-md text-white text-[10px] font-medium touch-manipulation min-h-[44px]",
      numpadKeyClass: isMobile
        ? "h-10 rounded-md border bg-muted font-bold text-base touch-manipulation active:bg-primary active:text-primary-foreground"
        : "h-11 rounded-md border bg-muted font-bold text-base touch-manipulation active:bg-primary active:text-primary-foreground",
      confirmButtonClass: isMobile ? "w-full h-11 text-sm font-bold" : "w-full h-12 text-sm font-bold",
      sheetHeightClass: isMobile
        ? "h-[min(78dvh,600px)]"
        : "h-[min(72dvh,560px)]",
    },
    topbar: {
      modeButtonClass: "flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium transition-colors touch-manipulation min-h-[40px]",
      showModeText: !isMobile,
      showFiadoLink: !isMobile,
      showCierreLabel: isDesktop,
    },
    ux: {
      hapticOnAdd: isMobile || isTablet,
      keyboardShortcuts: isDesktop || isTablet,
      touchMinPx: 44,
    },
  }
}

function baseKiosko(profile: PosDeviceProfile): LayoutBase {
  const isMobile = profile === "mobile"
  const base = baseMostrador(profile)

  return {
    ...base,
    carrito: {
      showSidePanel: false,
      showBottomBar: true,
      showCartSheet: false,
      showPendientesPanel: false,
      productosPanelClass: "w-full",
      cartPanelClass: "",
    },
    productos: {
      gridClass: isMobile
        ? "grid-cols-2"
        : profile === "tablet"
          ? "grid-cols-3"
          : "grid-cols-4",
      cardMinHeightClass: isMobile ? "min-h-[108px]" : "min-h-[100px]",
      scrollPaddingClass: "pb-[4.5rem]",
      searchInputClass: "h-12 text-base",
    },
    cobro: {
      ...base.cobro,
      numpadDefaultOpen: false,
    },
    ux: {
      ...base.ux,
      keyboardShortcuts: false,
    },
  }
}

const RESOLVERS: Record<PosModoLayout, (profile: PosDeviceProfile) => LayoutBase> = {
  mostrador: baseMostrador,
  mesa: baseMostrador,
  kiosko: baseKiosko,
}

/** Resuelve layout completo según perfil de dispositivo y modo POS. */
export function resolvePosLayout(
  profile: PosDeviceProfile,
  modo: PosModoLayout = "mostrador",
): PosLayoutConfig {
  const base = RESOLVERS[modo](profile)
  return { profile, modo, ...base }
}

/** Permite sobreescribir parámetros (p. ej. config empresa futura). */
export function mergePosLayoutOverrides(
  base: PosLayoutConfig,
  overrides: DeepPartial<PosLayoutConfig>,
): PosLayoutConfig {
  return deepMerge(base, overrides) as PosLayoutConfig
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const out = { ...target }
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sv = source[key]
    if (sv === undefined) continue
    const tv = target[key]
    if (
      typeof sv === "object" &&
      sv !== null &&
      !Array.isArray(sv) &&
      typeof tv === "object" &&
      tv !== null &&
      !Array.isArray(tv)
    ) {
      ;(out as Record<string, unknown>)[key as string] = deepMerge(
        tv as object,
        sv as DeepPartial<object>,
      )
    } else {
      ;(out as Record<string, unknown>)[key as string] = sv
    }
  }
  return out
}