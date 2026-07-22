"use client"

import { useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"

/**
 * Google Sign-In Button — usa Google Identity Services (GSI) library.
 *
 * Carga el script de GSI, renderiza el botón con el estilo de Google,
 * y callback con el id_token para verificación server-side.
 *
 * Requiere `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en el entorno.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            context?: string
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              type?: "standard" | "icon"
              theme?: "outline" | "filled_blue" | "filled_black"
              size?: "large" | "medium" | "small"
              text?: "signin_with" | "signup_with" | "continue_with" | "signin"
              shape?: "rectangular" | "pill" | "circle" | "square"
              logo_alignment?: "left" | "center"
              width?: number
              locale?: string
            },
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

interface GoogleSignInButtonProps {
  /** Callback invocado con el Google ID token (credential) */
  onCredential: (idToken: string) => void
  /** Texto del botón */
  text?: "signin_with" | "signup_with" | "continue_with" | "signin"
  /** Disabled state */
  disabled?: boolean
  /** Mostrar fallback custom si GSI no carga */
  className?: string
}

export function GoogleSignInButton({
  onCredential,
  text = "continue_with",
  disabled = false,
  className = "",
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const initializeGSI = useCallback(() => {
    if (!window.google?.accounts?.id || !clientId || !buttonRef.current) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          callbackRef.current(response.credential)
        }
      },
      context: "signin",
    })

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "left",
      width: 400,
      locale: "es_AR",
    })
  }, [clientId, text])

  useEffect(() => {
    if (!clientId) return

    // Si el script GSI ya está cargado, inicializar directamente
    if (window.google?.accounts?.id) {
      initializeGSI()
      return
    }

    // Cargar script de Google Identity Services
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      // Script existe pero aún no cargó
      existing.addEventListener("load", initializeGSI)
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = initializeGSI
    script.onerror = () => {
      console.warn("[GoogleSignIn] No se pudo cargar el SDK de Google")
    }
    document.head.appendChild(script)
  }, [clientId, initializeGSI])

  // Si no hay Client ID configurado, no mostrar nada
  if (!clientId) {
    return null
  }

  return (
    <div className={className}>
      {/* Contenedor del botón nativo de Google */}
      <div
        ref={buttonRef}
        style={{
          display: "flex",
          justifyContent: "center",
          minHeight: 44,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      />

      {/* Fallback si el script no carga (por adblock, etc.) */}
      <noscript>
        <Button type="button" variant="outline" className="w-full h-11" disabled>
          Google Sign-In requiere JavaScript
        </Button>
      </noscript>
    </div>
  )
}
