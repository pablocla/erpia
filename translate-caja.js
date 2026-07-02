const fs = require('fs');

const file = 'app/dashboard/caja/page.tsx';
if (!fs.existsSync(file)) {
  console.log('File does not exist: ' + file);
  process.exit(0);
}
let page = fs.readFileSync(file, 'utf8');

if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores"', 
    'import { useAuthStore } from "@/lib/stores"\nimport { useTranslations } from "next-intl"');
}

if (!page.includes('const t = useTranslations("cash")')) {
  page = page.replace('export default function CajaPage() {\n  const', 'export default function CajaPage() {\n  const t = useTranslations("cash")\n  const');
}

// Replace main titles and buttons
page = page.replace(
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">Caja y Tesorería</h1>',
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">{t("title")}</h1>'
);
page = page.replace(
  '>Nuevo Movimiento<',
  '>{t("newMovement")}<'
);
page = page.replace(
  '>Abrir Caja<',
  '>{t("openRegister")}<'
);
page = page.replace(
  '>Cerrar Caja<',
  '>{t("closeRegister")}<'
);

// Metrics
page = page.replace('Saldo Actual', '{t("balance")}');
page = page.replace('Ingresos', '{t("income")}');
page = page.replace('Egresos', '{t("expenses")}');

// Filters
page = page.replace('placeholder="Buscar movimiento..."', 'placeholder={t("search")}');

// Table Headers
page = page.replace('Fecha</TableHead>', '{t("table.date")}</TableHead>');
page = page.replace('Concepto</TableHead>', '{t("table.concept")}</TableHead>');
page = page.replace('Tipo</TableHead>', '{t("table.type")}</TableHead>');
page = page.replace('Monto</TableHead>', '{t("table.amount")}</TableHead>');
page = page.replace('Usuario</TableHead>', '{t("table.user")}</TableHead>');
page = page.replace('Acciones</TableHead>', '{t("table.actions")}</TableHead>');

fs.writeFileSync(file, page);
console.log('Cash page translated!');
