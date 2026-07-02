const fs = require('fs');

const file = 'app/dashboard/compras/page.tsx';
let page = fs.readFileSync(file, 'utf8');

if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores"', 
    'import { useAuthStore } from "@/lib/stores"\nimport { useTranslations } from "next-intl"');
}

if (!page.includes('const t = useTranslations("purchases")')) {
  page = page.replace('export default function ComprasPage() {\n  const', 'export default function ComprasPage() {\n  const t = useTranslations("purchases")\n  const');
}

// Replace main titles and buttons
page = page.replace(
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">Compras y Gastos</h1>',
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">{t("title")}</h1>'
);
page = page.replace(
  '>Nueva Compra<',
  '>{t("newPurchase")}<'
);

// Filters
page = page.replace('placeholder="Buscar comprobante, proveedor..."', 'placeholder={t("filters.supplier")}');
page = page.replace('Estado</SelectLabel>', '{t("filters.status")}</SelectLabel>');
page = page.replace('Todos los estados', '{t("filters.all")}');
page = page.replace('Completada', '{t("filters.completed")}');
page = page.replace('Pendiente', '{t("filters.pending")}');
page = page.replace('Cancelada', '{t("filters.canceled")}');

// Table Headers
page = page.replace('Fecha</TableHead>', '{t("table.date")}</TableHead>');
page = page.replace('Comprobante</TableHead>', '{t("table.invoice")}</TableHead>');
page = page.replace('Proveedor</TableHead>', '{t("table.supplier")}</TableHead>');
page = page.replace('Total</TableHead>', '{t("table.total")}</TableHead>');
page = page.replace('Estado</TableHead>', '{t("table.status")}</TableHead>');
page = page.replace('Acciones</TableHead>', '{t("table.actions")}</TableHead>');

fs.writeFileSync(file, page);
console.log('Purchases page translated!');
