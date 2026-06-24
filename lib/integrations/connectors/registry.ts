import type { IntegrationConnector } from "../types"
import { createStubConnector } from "./base"
import { afipConnector } from "./afip"
import { mercadoLibreConnector } from "./mercadolibre"
import { mercadoPagoConnector } from "./mercadopago"
import { shopifyConnector } from "./shopify"
import { tiendaNubeConnector } from "./tiendanube"
import { wooCommerceConnector } from "./woocommerce"
import { telegramConnector } from "./telegram"
import { whatsappConnector } from "./whatsapp"
import { createWebhookConnector } from "./webhook"
import { createCarrierConnector } from "./carrier"

const STUBS: Array<[string, string, string[]]> = [
  ["vtex", "VTEX", ["accountName", "appKey", "appToken"]],
  ["mercado_shops", "Mercado Shops", []],
  ["amazon", "Amazon Seller", []],
  ["stripe", "Stripe", ["secretKey", "publishableKey"]],
  ["google_workspace", "Google Workspace", []],
  ["microsoft_365", "Microsoft 365", []],
  ["booking", "Booking.com", []],
  ["airbnb", "Airbnb", []],
  ["hubspot", "HubSpot", []],
  ["rd_station", "RD Station", ["apiKey"]],
  ["salesforce", "Salesforce", []],

  ["power_bi", "Power BI", []],

  ["dhl", "DHL", ["accountNumber", "apiKey"]],
  ["odoo", "Odoo", ["url", "database", "apiKey"]],
  ["erpnext", "ERPNext", ["url", "apiKey", "apiSecret"]],
  ["prestashop", "PrestaShop", ["url", "apiKey"]],
]

const CONNECTORS: IntegrationConnector[] = [
  mercadoPagoConnector,
  mercadoLibreConnector,
  tiendaNubeConnector,
  shopifyConnector,
  wooCommerceConnector,
  afipConnector,
  telegramConnector,
  whatsappConnector,
  createWebhookConnector("n8n", "n8n", "webhookUrl"),
  createWebhookConnector("zapier", "Zapier", "zapierWebhookUrl"),
  createWebhookConnector("make", "Make", "makeWebhookUrl"),
  createCarrierConnector("andreani", ["usuario", "password"]),
  createCarrierConnector("oca", ["usuario", "password"]),
  createCarrierConnector("correo_argentino", ["apiKey"]),
  ...STUBS.map(([id, nombre, fields]) => createStubConnector(id, nombre, fields)),
]

const MAP = new Map(CONNECTORS.map((c) => [c.id, c]))

export function getConnector(integracionId: string): IntegrationConnector | undefined {
  return MAP.get(integracionId)
}

export function listConnectorIds(): string[] {
  return [...MAP.keys()]
}