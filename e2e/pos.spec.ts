import { test, expect } from "@playwright/test"
import { loginDemo, mockPosApis } from "./helpers/auth"

test("abrir POS y ver semáforos/indicadores", async ({ page }) => {
  await mockPosApis(page)
  await loginDemo(page)

  await page.goto("/dashboard/pos")

  await expect(
    page.getByPlaceholder("Buscar por nombre, código o código de barras...")
  ).toBeVisible()
  await expect(page.getByText("TOTAL", { exact: true })).toBeVisible()
  await expect(page.getByText("Caja abierta")).toBeVisible()
})