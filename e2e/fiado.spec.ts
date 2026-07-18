import { test, expect } from "@playwright/test"
import { loginDemo, mockFiadoApis } from "./helpers/auth"

test("libreta fiado muestra deudores y resumen", async ({ page }) => {
  await mockFiadoApis(page)
  await loginDemo(page)

  await page.goto("/dashboard/fiado")

  await expect(page.getByText(/quién me debe|libreta|fiado/i).first()).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText(/Juan Pérez/i).first()).toBeVisible({ timeout: 10_000 })
})
