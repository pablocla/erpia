import type { Page } from "@playwright/test"

const DEMO_USUARIO = {
  id: "1",
  email: "testing@claver.com.ar",
  nombre: "Admin Demo",
  rol: "admin",
  empresaId: 1,
  empresaNombre: "Empresa Demo",
}

/** Login estable para smoke E2E — no depende del botón de la UI de login */
export async function loginDemo(page: Page) {
  await mockDashboardShell(page)

  await page.goto("/login")
  await page.evaluate((usuario) => {
    localStorage.setItem("token", "e2e-mock-token")
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: "e2e-mock-token",
          user: usuario,
          isAuthenticated: true,
        },
        version: 0,
      }),
    )
  }, DEMO_USUARIO)
  await page.goto("/dashboard")
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

/** Mocks de shell (layout, trial, empresa) */
export async function mockDashboardShell(page: Page) {
  await page.route("**/api/config/trial", async (route) => {
    await route.fulfill({
      json: {
        trial: {
          activo: true,
          expirado: false,
          diasRestantes: 12,
          expiresAt: new Date(Date.now() + 12 * 864e5).toISOString(),
          trialDias: 14,
        },
        access: {
          tieneAnclaGratis: true,
          anclaSkus: ["pos.fiado_barrio"],
          precioUpgradeArs: 12900,
          bloqueoTotal: false,
          mpAutorizado: false,
          ofertaLema: "Libreta gratis + módulos en trial.",
        },
      },
    })
  })

  await page.route("**/api/config/empresa", async (route) => {
    await route.fulfill({
      json: {
        id: 1,
        nombre: "Empresa Demo",
        modoLite: "fiado",
        rubro: "kiosco",
        demoIndustryId: "almacen",
        condicionIva: "Monotributista",
      },
    })
  })

  await page.route("**/api/config/modulos", async (route) => {
    await route.fulfill({ json: { pos: true, fiado: true, caja: true, stock: true } })
  })

  await page.route("**/api/config/features", async (route) => {
    await route.fulfill({ json: [] })
  })

  await page.route("**/api/platform/productos", async (route) => {
    await route.fulfill({
      json: {
        mapa: { "pos.fiado_barrio": true, "core.claver": true },
        productos: [],
        packs: [],
      },
    })
  })

  await page.route("**/api/claver/analista/status", async (route) => {
    await route.fulfill({ json: { isAnalyst: false } })
  })
}

/** Mocks mínimos para que POS cargue sin backend real */
export async function mockPosApis(page: Page) {
  await mockDashboardShell(page)

  await page.route("**/api/pos/venta**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { cajaAbierta: true, cajaId: 1, fiadoActivo: true },
      })
      return
    }
    await route.fulfill({
      json: {
        ok: true,
        numeroCompleto: "0001-00000001",
        vuelto: 0,
        facturaId: 1,
      },
    })
  })

  await page.route("**/api/productos**", async (route) => {
    await route.fulfill({
      json: [
        {
          id: 1,
          nombre: "Producto Test",
          codigo: "TST001",
          codigoBarras: "7790001000001",
          precioVenta: 1000,
          porcentajeIva: 21,
          stock: 10,
        },
      ],
    })
  })

  await page.route("**/api/maestros/categorias**", async (route) => {
    await route.fulfill({ json: [{ id: 1, nombre: "General" }] })
  })

  await page.route("**/api/clientes**", async (route) => {
    await route.fulfill({
      json: [
        {
          id: 1,
          nombre: "Juan Pérez — Fiado barrio",
          telefono: "1145678901",
          fiadoHabilitado: true,
          limiteCredito: 20000,
          saldoCuentaCorriente: -8500,
        },
      ],
    })
  })

  await page.route("**/api/caja**", async (route) => {
    await route.fulfill({
      json: { id: 1, estado: "abierta", saldoInicial: 5000, abierta: true },
    })
  })
}

/** Mocks de Libreta Fiado */
export async function mockFiadoApis(page: Page) {
  await mockDashboardShell(page)

  await page.route("**/api/fiado/deudores**", async (route) => {
    await route.fulfill({
      json: {
        data: [
          {
            id: 1,
            nombre: "Juan Pérez — Fiado barrio",
            telefono: "11-4567-8901",
            deuda: 8500,
            limiteCredito: 20000,
            disponible: 11500,
            emailNotificacionFiado: null,
          },
        ],
      },
    })
  })

  await page.route("**/api/fiado/resumen**", async (route) => {
    await route.fulfill({
      json: {
        totalDeudores: 1,
        saldoFiadoTotal: 8500,
        fiadosHoy: 0,
        notificacionesHoy: 0,
      },
    })
  })

  await page.route("**/api/fiado/config**", async (route) => {
    await route.fulfill({
      json: {
        emailDuenoAlmacen: null,
        fiadoRequiereLimite: true,
        fiadoNotificarWhatsApp: false,
        email: null,
        nombre: "Demo Almacén",
      },
    })
  })
}
