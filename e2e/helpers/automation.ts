import type { Page } from "@playwright/test"

const MOCK_CONFIG = {
  n8nBaseUrl: null,
  n8nApiKeySet: false,
  webhookSecret: "e2e-test-secret-32chars-minimum-ok",
  activo: false,
  eventMaps: [],
  playbooks: [{ id: 1, playbookKey: "stock_bajo_tarea", nombre: "Stock bajo", activo: true, parametros: {} }],
  virtualWorkers: [
    {
      id: 1,
      nombre: "Ana Reposición",
      rol: "deposito",
      playbooks: ["stock_bajo_tarea"],
      cron: "0 8 * * 1-5",
      activo: true,
      lastRunAt: null,
    },
  ],
}

const MOCK_EVENTS = {
  events: [
    { key: "VENTA_EMITIDA", label: "Venta emitida", activo: false, configurado: false, n8nWebhookUrl: null },
    { key: "STOCK_BAJO", label: "Stock bajo mínimo", activo: false, configurado: false, n8nWebhookUrl: null },
    { key: "WEBHOOK_TEST", label: "Prueba de conexión", activo: false, configurado: false, n8nWebhookUrl: null },
  ],
}

export async function mockAutomationApis(page: Page) {
  await page.route("**/api/automation/config", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: MOCK_CONFIG })
      return
    }
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        json: {
          ...MOCK_CONFIG,
          ...body,
          n8nApiKeySet: false,
        },
      })
      return
    }
    await route.continue()
  })

  await page.route("**/api/automation/events", async (route) => {
    await route.fulfill({ json: MOCK_EVENTS })
  })

  await page.route("**/api/automation/executions*", async (route) => {
    await route.fulfill({ json: [] })
  })

  await page.route("**/api/automation/catalog", async (route) => {
    await route.fulfill({
      json: {
        playbooks: [{ playbookKey: "stock_bajo_tarea", nombre: "Stock bajo" }],
        virtualWorkers: [
          {
            nombre: "Ana Reposición",
            rol: "deposito",
            playbooks: ["stock_bajo_tarea"],
            cron: "0 8 * * 1-5",
            activo: true,
            descripcion: "Monitorea stock bajo.",
            entitlementSku: "automation.n8n_hub",
          },
        ],
      },
    })
  })

  await page.route("**/api/automation/seed", async (route) => {
    await route.fulfill({
      json: {
        seeded: true,
        playbooks: 11,
        workers: 10,
        config: {
          ...MOCK_CONFIG,
          virtualWorkers: [{ id: 1, nombre: "Ana Reposición", rol: "deposito", playbooks: ["stock_bajo_tarea"], cron: "0 8 * * 1-5", activo: true, lastRunAt: null }],
          playbooks: [{ id: 1, playbookKey: "stock_bajo_tarea", nombre: "Stock bajo", activo: true, parametros: {} }],
        },
      },
    })
  })

  await page.route("**/api/automation/test", async (route) => {
    await route.fulfill({ json: { ok: true, eventKey: "WEBHOOK_TEST" } })
  })

  await page.route("**/api/platform/suscripciones", async (route) => {
    await route.fulfill({
      json: {
        suscripciones: [
          {
            id: 1,
            sku: "automation.n8n_hub",
            activo: true,
            producto: { nombre: "NOP Automation Hub", sku: "automation.n8n_hub" },
            uso: { mes: "2026-06", usado: 42, limite: 50000 },
          },
        ],
      },
    })
  })
}

/** Evita 401 en layout del dashboard durante E2E */
export async function mockDashboardApis(page: Page) {
  await page.route("**/api/config/features", async (route) => {
    await route.fulfill({ json: [{ featureKey: "automation_n8n", activado: true }] })
  })

  await page.route("**/api/config/modulos", async (route) => {
    await route.fulfill({ json: { modulos: {} } })
  })

  await page.route("**/api/config/empresa", async (route) => {
    await route.fulfill({
      json: { id: 1, nombre: "Empresa Demo", rubro: "salon_belleza" },
    })
  })

  await page.route("**/api/pendientes*", async (route) => {
    await route.fulfill({ json: [] })
  })
}