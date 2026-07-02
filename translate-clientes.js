const fs = require('fs');

const file = 'app/dashboard/clientes/page.tsx';
let page = fs.readFileSync(file, 'utf8');

if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores"', 
    'import { useAuthStore } from "@/lib/stores"\nimport { useTranslations } from "next-intl"');
}

if (!page.includes('const t = useTranslations("customers")')) {
  page = page.replace('export default function ClientesPage() {\n  const', 'export default function ClientesPage() {\n  const t = useTranslations("customers")\n  const');
}

// Replace main titles and buttons
page = page.replace(
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">Directorio de Clientes</h1>',
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">{t("title")}</h1>'
);
page = page.replace(
  '>Nuevo Cliente<',
  '>{t("newCustomer")}<'
);
page = page.replace(
  '>Exportar<',
  '>{t("export")}<'
);

// Filters
page = page.replace('placeholder="Buscar cliente, CUIT/DNI, email..."', 'placeholder={t("search")}');

// Table Headers
page = page.replace('Nombre</TableHead>', '{t("table.name")}</TableHead>');
page = page.replace('Documento</TableHead>', '{t("table.document")}</TableHead>');
page = page.replace('Condición</TableHead>', '{t("table.condition")}</TableHead>');
page = page.replace('Saldo</TableHead>', '{t("table.balance")}</TableHead>');
page = page.replace('Acciones</TableHead>', '{t("table.actions")}</TableHead>');

fs.writeFileSync(file, page);
console.log('Customers page translated!');
