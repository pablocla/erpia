import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/* ═══════════════════════════════════════════════════════════════════════════
   UI PREFERENCES STORE — User interface preferences (Zustand)
   Sidebar state, density, locale, recent pages, command palette, etc.
   ═══════════════════════════════════════════════════════════════════════════ */

export type UIDensity = "compact" | "normal" | "comfortable"
export type Locale = "es-AR" | "es-MX" | "pt-BR" | "en-US"

interface RecentPage {
  href: string
  label: string
  visitedAt: number
}

interface FavoritePage {
  href: string
  label: string
  icon?: string
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarPinned: boolean

  // Display
  density: UIDensity
  locale: Locale
  animationsEnabled: boolean

  // Command palette
  commandPaletteOpen: boolean

  // Chat widget
  chatWidgetOpen: boolean

  // Recent navigation
  recentPages: RecentPage[]

  // Favorites
  favoritePages: FavoritePage[]

  // Expanded sidebar sections (persisted)
  expandedSections: string[]

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarPinned: (pinned: boolean) => void
  setDensity: (density: UIDensity) => void
  setLocale: (locale: Locale) => void
  setAnimationsEnabled: (enabled: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleChatWidget: () => void
  setChatWidgetOpen: (open: boolean) => void
  addRecentPage: (href: string, label: string) => void
  toggleFavorite: (href: string, label: string, icon?: string) => void
  isFavorite: (href: string) => boolean
  toggleSection: (section: string) => void
}

const MAX_RECENT = 10

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarPinned: true,
      density: "normal",
      locale: "es-AR",
      animationsEnabled: true,
      commandPaletteOpen: false,
      chatWidgetOpen: false,
      recentPages: [],
      favoritePages: [],
      expandedSections: ["Principal"],

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarPinned: (pinned) => set({ sidebarPinned: pinned }),
      setDensity: (density) => set({ density }),
      setLocale: (locale) => set({ locale }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),

      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      toggleChatWidget: () => set((s) => ({ chatWidgetOpen: !s.chatWidgetOpen })),
      setChatWidgetOpen: (open) => set({ chatWidgetOpen: open }),

      addRecentPage: (href, label) =>
        set((state) => {
          const filtered = state.recentPages.filter((p) => p.href !== href)
          return {
            recentPages: [{ href, label, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT),
          }
        }),

      toggleFavorite: (href, label, icon) =>
        set((state) => {
          const exists = state.favoritePages.some((f) => f.href === href)
          return {
            favoritePages: exists
              ? state.favoritePages.filter((f) => f.href !== href)
              : [...state.favoritePages, { href, label, icon }],
          }
        }),

      isFavorite: (href) => get().favoritePages.some((f) => f.href === href),

      toggleSection: (section) =>
        set((state) => ({
          expandedSections: state.expandedSections.includes(section)
            ? state.expandedSections.filter((s) => s !== section)
            : [...state.expandedSections, section],
        })),
    }),
    {
      name: "erp-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarPinned: state.sidebarPinned,
        density: state.density,
        locale: state.locale,
        animationsEnabled: state.animationsEnabled,
        recentPages: state.recentPages,
        favoritePages: state.favoritePages,
        expandedSections: state.expandedSections,
      }),
    },
  ),
)
