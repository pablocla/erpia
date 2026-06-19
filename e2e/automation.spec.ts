import { test, expect } from "@playwright/test"
import { loginDemo } from "./helpers/auth"
import { mockAutomationApis, mockDashboardApis } from "./helpers/automation"

test.beforeEach(async ({ page }) => {
  await mockDashboardApis(page)
  await mockAutomationApis(page)
})

function wizard(page: import("@playwright/test").Page) {
  return page.getByTestId("automation-wizard")
}

test("automatizacion muestra wizard de 4 pasos", async ({ page }) => {
  await loginDemo(page)
  await page.goto("/dashboard/automatizacion")

  await expect(page.getByRole("heading", { name: "Automatización NOP" })).toBeVisible()
  await expect(wizard(page).getByText("Asistente de configuración")).toBeVisible()
  await expect(wizard(page).getByRole("heading", { name: "Conectá tu motor n8n" })).toBeVisible()
  await expect(wizard(page).getByText("Paso 1 de 4")).toBeVisible()
})

test("wizard avanza al paso de eventos", async ({ page }) => {
  await loginDemo(page)
  await page.goto("/dashboard/automatizacion")

  await wizard(page).getByTestId("wizard-n8n-url").fill("https://n8n.e2e.test")
  await wizard(page).getByRole("button", { name: /Siguiente/i }).click()

  await expect(wizard(page).getByRole("heading", { name: "Elegí qué eventos enviar" })).toBeVisible()
  await expect(wizard(page).getByText("Venta emitida")).toBeVisible()
  await expect(wizard(page).getByText("Paso 2 de 4")).toBeVisible()
})

test("muestra plan y uso de suscripción", async ({ page }) => {
  await loginDemo(page)
  await page.goto("/dashboard/automatizacion")

  await expect(page.getByText("Plan y uso del mes")).toBeVisible()
  await expect(page.getByText("Suscripción activa")).toBeVisible()
  await expect(page.getByText(/42/)).toBeVisible()
})

test("probar conexión desde wizard activa automatización", async ({ page }) => {
  await loginDemo(page)
  await page.goto("/dashboard/automatizacion")

  await wizard(page).getByTestId("wizard-n8n-url").fill("https://n8n.e2e.test")
  await wizard(page).getByRole("button", { name: /Siguiente/i }).click()
  await expect(wizard(page).getByText("Paso 2 de 4")).toBeVisible()

  await wizard(page).getByRole("button", { name: /Siguiente/i }).click()
  await expect(wizard(page).getByText("Paso 3 de 4")).toBeVisible()

  await wizard(page).getByRole("button", { name: /Siguiente/i }).click()
  await expect(wizard(page).getByText("Paso 4 de 4")).toBeVisible()
  await expect(wizard(page).getByRole("heading", { name: "Probá la conexión" })).toBeVisible()
  await wizard(page).getByTestId("wizard-test-activate").click()

  // Wizard se cierra al activar con éxito
  await expect(wizard(page)).not.toBeVisible({ timeout: 10_000 })
  await expect(page.getByText("Activo").first()).toBeVisible()
})