const fs = require('fs');

const file = 'app/dashboard/productos/page.tsx';
let page = fs.readFileSync(file, 'utf8');

if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores"', 
    'import { useAuthStore } from "@/lib/stores"\nimport { useTranslations } from "next-intl"');
}

if (!page.includes('const t = useTranslations("products")')) {
  page = page.replace('export default function ProductosPage() {\n  const', 'export default function ProductosPage() {\n  const t = useTranslations("products")\n  const');
}

// Replace main titles and buttons
page = page.replace(
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">Catálogo de Productos</h1>',
  '<h1 className="text-3xl font-extrabold tracking-tight text-gradient">{t("title")}</h1>'
);
page = page.replace(
  '>Nuevo Producto<',
  '>{t("newProduct")}<'
);
page = page.replace(
  '>Importar<',
  '>{t("import")}<'
);

// Filters
page = page.replace('placeholder="Buscar por código, nombre o categoría..."', 'placeholder={t("search")}');

// Table Headers
page = page.replace('Código</TableHead>', '{t("table.code")}</TableHead>');
page = page.replace('Nombre</TableHead>', '{t("table.name")}</TableHead>');
page = page.replace('Categoría</TableHead>', '{t("table.category")}</TableHead>');
page = page.replace('Precio</TableHead>', '{t("table.price")}</TableHead>');
page = page.replace('Stock</TableHead>', '{t("table.stock")}</TableHead>');
// Acciones might be repeated, replace globally using regex or replaceAll if necessary
page = page.replace('Acciones</TableHead>', '{t("table.actions")}</TableHead>');

fs.writeFileSync(file, page);
console.log('Products page translated!');
