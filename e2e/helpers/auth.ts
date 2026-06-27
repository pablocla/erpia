import type { Page } from "@playwright/test"

const DEMO_USUARIO = {
  id: "1",
  email: "testing@claver.com.ar",
  nombre: "Admin Demo",
  rol: "admin",
  empresaId: 1,
  empresaNombre: "Empresa Demo",
}

/** Login vía demo mockeado — no requiere DB para smoke E2E */
export async function loginDemo(page: Page) {
  await page.route("**/api/auth/demo", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        token: "e2e-mock-token",
        usuario: DEMO_USUARIO,
      }),
    })
  })

  await page.goto("/login")
  await page.getByRole("button", { name: "Acceder con cuenta Demo" }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

/** Mocks mínimos para que POS cargue sin backend real */
export async function mockPosApis(page: Page) {
  await page.route("**/api/pos/venta", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { cajaAbierta: true, cajaId: 1 },
      })
      return
    }
    await route.continue()
  })

  await page.route("**/api/productos?*", async (route) => {
    await route.fulfill({
      json: [
        {
          id: 1,
          nombre: "Producto Test",
          codigo: "TST001",
          precioVenta: 1000,
          porcentajeIva: 21,
          stock: 10,
        },
      ],
    })
  })

  await page.route("**/api/maestros/categorias", async (route) => {
    await route.fulfill({ json: [{ id: 1, nombre: "General" }] })
  })

  await page.route("**/api/clientes?*", async (route) => {
    await route.fulfill({ json: [] })
  })
}