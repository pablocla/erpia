"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { clearAuthTokenCookie, setAuthTokenCookie } from "@/lib/auth/token-cookie"
import { useAuthStore } from "@/lib/stores/auth-store"

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  empresaId: number
}

/** Rutas donde un token inválido no debe expulsar al usuario (flujo demo/público). */
function isAuthOptionalPath(pathname: string): boolean {
  if (pathname.startsWith("/login")) return true
  if (pathname.startsWith("/demo")) return true
  if (pathname.startsWith("/claver") && !pathname.startsWith("/claver-cloud")) return true
  if (pathname.startsWith("/marketing")) return true
  if (pathname.startsWith("/modulos")) return true
  if (pathname === "/" || pathname === "") return true
  return false
}

function toAuthUser(usuarioData: Usuario) {
  return {
    ...usuarioData,
    id: String(usuarioData.id),
  } as unknown as import("@/lib/stores/auth-store").AuthUser
}

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  /** Evita que un /api/auth/me obsoleto borre un login/demo recién aplicado. */
  const sessionGenRef = useRef(0)

  const clearSessionLocal = useCallback(() => {
    localStorage.removeItem("token")
    clearAuthTokenCookie()
    setToken(null)
    setUsuario(null)
    useAuthStore.getState().logout()
  }, [])

  const cargarUsuario = useCallback(
    async (tokenActual: string, gen: number) => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${tokenActual}`,
          },
        })

        // Login/demo concurrente: no tocar la sesión nueva
        if (gen !== sessionGenRef.current) return
        if (typeof window !== "undefined" && localStorage.getItem("token") !== tokenActual) return

        if (response.ok) {
          const data = await response.json()
          setUsuario(data.usuario)
          useAuthStore.getState().login(tokenActual, data.usuario)
          return
        }

        const data = await response.json().catch(() => ({}))
        if (data.code === "TOKEN_EXPIRED" || response.status === 401) {
          const refreshed = await intentarRefresh(tokenActual, gen)
          if (refreshed) return
        }

        // Token inválido: limpiar sin redirigir en rutas públicas (demo, marketing…)
        if (gen !== sessionGenRef.current) return
        if (typeof window !== "undefined" && localStorage.getItem("token") !== tokenActual) return

        clearSessionLocal()
        if (typeof window !== "undefined" && !isAuthOptionalPath(window.location.pathname)) {
          window.location.href = "/login"
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error)
      } finally {
        if (gen === sessionGenRef.current) setCargando(false)
      }
    },
    [clearSessionLocal],
  )

  useEffect(() => {
    const tokenGuardado = localStorage.getItem("token")
    if (tokenGuardado) {
      setAuthTokenCookie(tokenGuardado)
      setToken(tokenGuardado)
      const gen = sessionGenRef.current
      void cargarUsuario(tokenGuardado, gen)
    } else {
      setCargando(false)
    }
  }, [cargarUsuario])

  const intentarRefresh = async (tokenExpirado: string, gen: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenExpirado}` },
      })
      if (!res.ok) return false
      const data = await res.json()
      if (!data.token) return false
      if (gen !== sessionGenRef.current) return false

      localStorage.setItem("token", data.token)
      setAuthTokenCookie(data.token)
      setToken(data.token)
      if (data.usuario) {
        setUsuario(data.usuario)
        useAuthStore.getState().login(data.token, data.usuario)
      }
      return true
    } catch {
      return false
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (data.success) {
      sessionGenRef.current += 1
      localStorage.setItem("token", data.token)
      setAuthTokenCookie(data.token)
      setToken(data.token)
      setUsuario(data.usuario)
      useAuthStore.getState().login(data.token, toAuthUser(data.usuario))
      setCargando(false)
      return { success: true, usuario: data.usuario, token: data.token as string }
    }

    return { success: false, error: data.error }
  }

  const logout = () => {
    sessionGenRef.current += 1
    localStorage.removeItem("token")
    sessionStorage.removeItem("claver-cloud-verified")
    sessionStorage.removeItem("claver_analyst_token")
    sessionStorage.removeItem("claver_analyst_user")
    clearAuthTokenCookie()
    setToken(null)
    setUsuario(null)
    useAuthStore.getState().logout()
  }

  const loginConToken = (tokenNuevo: string, usuarioData: Usuario) => {
    // Invalida cualquier /api/auth/me en vuelo de un token viejo
    sessionGenRef.current += 1
    localStorage.setItem("token", tokenNuevo)
    setAuthTokenCookie(tokenNuevo)
    setToken(tokenNuevo)
    setUsuario(usuarioData)
    useAuthStore.getState().login(tokenNuevo, toAuthUser(usuarioData))
    setCargando(false)
  }

  return {
    usuario,
    token,
    cargando,
    autenticado: !!usuario && !!token,
    login,
    loginConToken,
    logout,
  }
}
