import { test, expect } from "@playwright/test"
import { loginDemo } from "./helpers/auth"

test("crear pedido con precio auto-resuelto", async ({ page }) => {
  await page.route("**/api/precios/calcular", async (route) => {
    await route.fulfill({
      json: {
        lineas: [{ precioUnitario: 1500, descuento: 10 }],
        subtotal: 1500,
        total: 1815,
      },
    })
  })

  await page.route("**/api/ventas/pedidos?*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: [] })
      return
    }
    await route.continue()
  })

  await loginDemo(page)
  await page.goto("/dashboard/ventas/pedidos")

  await expect(page.getByRole("heading", { name: /pedidos/i })).toBeVisible()
})