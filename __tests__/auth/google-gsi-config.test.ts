import { describe, expect, it } from "vitest"
import {
  GOOGLE_GSI_COEP_VALUE,
  GOOGLE_GSI_COOP_VALUE,
  GOOGLE_GSI_FEDCM_PERMISSIONS_POLICY,
  buildGoogleGsiInitConfig,
  mensajeErrorGoogleGsi,
} from "@/lib/auth/google-gsi-config"

describe("Google GSI / COOP", () => {
  it("usa COOP que deja vivo window.opener para el popup de Google", () => {
    expect(GOOGLE_GSI_COOP_VALUE).toBe("same-origin-allow-popups")
    expect(GOOGLE_GSI_COEP_VALUE).toBe("unsafe-none")
  })

  it("habilita FedCM en Permissions-Policy y en initialize()", () => {
    expect(GOOGLE_GSI_FEDCM_PERMISSIONS_POLICY).toContain("identity-credentials-get")
    expect(GOOGLE_GSI_FEDCM_PERMISSIONS_POLICY).toContain("accounts.google.com")

    const cfg = buildGoogleGsiInitConfig({
      clientId: "client.apps.googleusercontent.com",
      callback: () => {},
    })
    expect(cfg.use_fedcm_for_button).toBe(true)
    expect(cfg.use_fedcm_for_prompt).toBe(true)
    expect(cfg.ux_mode).toBe("popup")
    expect(cfg.itp_support).toBe(true)
  })

  it("explica cierre de popup y bloqueo", () => {
    expect(mensajeErrorGoogleGsi({ type: "popup_closed" })).toMatch(/Cerraste/)
    expect(mensajeErrorGoogleGsi({ type: "popup_failed_to_open" })).toMatch(/popups/)
    expect(mensajeErrorGoogleGsi(undefined)).toMatch(/Google/)
  })
})
