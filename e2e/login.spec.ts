import { test, expect } from "@playwright/test"
import { loginDemo } from "./helpers/auth"

test("login demo redirecciona al dashboard", async ({ page }) => {
  await loginDemo(page)

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.locator("body")).toBeVisible()
})