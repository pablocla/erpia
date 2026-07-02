const fs = require('fs');

let page = fs.readFileSync('app/dashboard/page.tsx', 'utf8');

// 1. Add useTranslations import
if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores/auth-store"', 
    'import { useAuthStore } from "@/lib/stores/auth-store"\nimport { useTranslations } from "next-intl"');
}

// 2. Inject t function in DashboardCajero
page = page.replace(
  'function DashboardCajero({ user, authHeaders }: { user: any; authHeaders: () => HeadersInit }) {\n  const { pendientes',
  'function DashboardCajero({ user, authHeaders }: { user: any; authHeaders: () => HeadersInit }) {\n  const t = useTranslations("dashboard");\n  const { pendientes'
);

// Replace Cajero texts
page = page.replace(
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">Panel de Ventas</h1>',
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">{t("salesPanel")}</h1>'
);
page = page.replace(
  '<p className="text-muted-foreground text-sm mt-1">Cajero:',
  '<p className="text-muted-foreground text-sm mt-1">{t("cashier")}:'
);
page = page.replace(
  'Abrir Caja Registradora (POS)',
  '{t("openPos")}'
);
page = page.replace(
  '<CardTitle className="text-lg">Resumen Diario</CardTitle>',
  '<CardTitle className="text-lg">{t("summary")}</CardTitle>'
);
page = page.replace(
  'titulo="Ventas"',
  'titulo={t("sales")}'
);
page = page.replace(
  'titulo="Devoluciones"',
  'titulo={t("returns")}'
);
page = page.replace(
  'titulo="Caja Fuerte"',
  'titulo={t("cashDrawer")}'
);
page = page.replace(
  '<CardTitle>Transacciones Recientes</CardTitle>',
  '<CardTitle>{t("recentTx")}</CardTitle>'
);
page = page.replace(
  'No hay transacciones aún hoy.',
  '{t("noTx")}'
);

// 3. Inject t function in DashboardMaster
page = page.replace(
  'function DashboardMaster({ user, authHeaders }: { user: any; authHeaders: () => HeadersInit }) {\n  const { pendientes',
  'function DashboardMaster({ user, authHeaders }: { user: any; authHeaders: () => HeadersInit }) {\n  const t = useTranslations("dashboard");\n  const { pendientes'
);

// Replace Master texts
page = page.replace(
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">Panel de Control Principal</h1>',
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">{t("masterPanel")}</h1>'
);
page = page.replace(
  '<CardTitle className="text-lg">Resumen del Mes</CardTitle>',
  '<CardTitle className="text-lg">{t("monthSummary")}</CardTitle>'
);
page = page.replace(
  'titulo="Ventas del Mes"',
  'titulo={t("monthlySales")}'
);
page = page.replace(
  'titulo="Total Facturas"',
  'titulo={t("totalInvoices")}'
);
page = page.replace(
  'titulo="Impuestos a Pagar"',
  'titulo={t("pendingTaxes")}'
);
page = page.replace(
  '<CardTitle>Evolución de Ventas</CardTitle>',
  '<CardTitle>{t("salesEvolution")}</CardTitle>'
);
page = page.replace(
  '<CardTitle>Top Clientes</CardTitle>',
  '<CardTitle>{t("topCustomers")}</CardTitle>'
);
page = page.replace(
  '<CardTitle>Alertas de Inventario</CardTitle>',
  '<CardTitle>{t("inventoryAlerts")}</CardTitle>'
);
page = page.replace(
  'Ver Todo',
  '{t("viewAll")}'
);
page = page.replace(
  'Sin Stock',
  '{t("outOfStock")}'
);
page = page.replace(
  'Bajo Stock',
  '{t("lowStock")}'
);

fs.writeFileSync('app/dashboard/page.tsx', page);
console.log('Dashboard translated!');
