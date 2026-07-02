const fs = require('fs');

const file = 'app/dashboard/ventas/page.tsx';
let page = fs.readFileSync(file, 'utf8');

if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores"', 
    'import { useAuthStore } from "@/lib/stores"\nimport { useTranslations } from "next-intl"');
}

if (!page.includes('const t = useTranslations("sales")')) {
  page = page.replace('export default function VentasPage() {\n  const', 'export default function VentasPage() {\n  const t = useTranslations("sales")\n  const');
}

// Replace main titles and buttons
page = page.replace(
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">Ventas y Facturación</h1>',
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">{t("title")}</h1>'
);
page = page.replace(
  '<Button className="gap-2 rounded-xl shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all">',
  '<Button className="gap-2 rounded-xl shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all">\n            <Plus className="h-4 w-4" />\n            {t("newSale")}'
);
// We might need to just replace 'Nueva Venta' entirely
page = page.replace(
  '>Nueva Venta<',
  '>{t("newSale")}<'
);

// Filters
page = page.replace('placeholder="Buscar comprobante, cliente..."', 'placeholder={t("filters.client")}');
page = page.replace('Estado</SelectLabel>', '{t("filters.status")}</SelectLabel>');
page = page.replace('Todos los estados', '{t("filters.all")}');
page = page.replace('Completada', '{t("filters.completed")}');
page = page.replace('Pendiente', '{t("filters.pending")}');
page = page.replace('Cancelada', '{t("filters.canceled")}');

// Table Headers
page = page.replace('Fecha</TableHead>', '{t("table.date")}</TableHead>');
page = page.replace('Comprobante</TableHead>', '{t("table.invoice")}</TableHead>');
page = page.replace('Cliente</TableHead>', '{t("table.client")}</TableHead>');
page = page.replace('Total</TableHead>', '{t("table.total")}</TableHead>');
page = page.replace('Estado</TableHead>', '{t("table.status")}</TableHead>');
page = page.replace('Acciones</TableHead>', '{t("table.actions")}</TableHead>');

fs.writeFileSync(file, page);
console.log('Sales page translated!');
