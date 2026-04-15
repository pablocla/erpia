"use client"

import { useState, useEffect } from "react"

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  empresaId: number
}

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Cargar token del localStorage
    const tokenGuardado = localStorage.getItem("token")
    if (tokenGuardado) {
      setToken(tokenGuardado)
      cargarUsuario(tokenGuardado)
    } else {
      setCargando(false)
    }
  }, [])

  const cargarUsuario = async (tokenActual: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${tokenActual}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsuario(data.usuario)
      } else {
        // If token expired, try to refresh it
        const data = await response.json().catch(() => ({}))
        if (data.code === "TOKEN_EXPIRED" || response.status === 401) {
          const refreshed = await intentarRefresh(tokenActual)
          if (refreshed) return
        }
        // Token inválido and refresh failed, clean up and redirect to login
        localStorage.removeItem("token")
        setToken(null)
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login"
        }
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error)
    } finally {
      setCargando(false)
    }
  }

  const intentarRefresh = async (tokenExpirado: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenExpirado}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem("token", data.token)
          setToken(data.token)
          if (data.usuario) setUsuario(data.usuario)
          return true
        }
      }
    } catch {}
    return false
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
      localStorage.setItem("token", data.token)
      setToken(data.token)
      setUsuario(data.usuario)
      return { success: true }
    }

    return { success: false, error: data.error }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUsuario(null)
  }

  const loginConToken = (tokenNuevo: string, usuarioData: Usuario) => {
    localStorage.setItem("token", tokenNuevo)
    setToken(tokenNuevo)
    setUsuario(usuarioData)
  }

  return {
    usuario,
    token,
    cargando,
    autenticado: !!usuario,
    login,
    loginConToken,
    logout,
  }
}
