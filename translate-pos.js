const fs = require('fs');

const file = 'app/dashboard/pos/page.tsx';
let page = fs.readFileSync(file, 'utf8');

if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores"', 
    'import { useAuthStore } from "@/lib/stores"\nimport { useTranslations } from "next-intl"');
}

if (!page.includes('const t = useTranslations("pos")')) {
  page = page.replace('export default function POSPage() {\n  const', 'export default function POSPage() {\n  const t = useTranslations("pos")\n  const');
}

// POS replacements
page = page.replace('Buscar producto por nombre o código de barras (F2)...', '{t("searchProduct")}');
page = page.replace('>Total<', '>{t("total")}<');
page = page.replace('>Subtotal<', '>{t("subtotal")}<');
page = page.replace('>Descuento<', '>{t("discount")}<');
page = page.replace('No hay productos en el carrito', '{t("noProductsInCart")}');
page = page.replace('>Carrito<', '>{t("cart")}<');
page = page.replace('>Cancelar Venta<', '>{t("cancelSale")}<');
page = page.replace('>Medio de Pago<', '>{t("paymentMethod")}<');
page = page.replace('>Efectivo<', '>{t("cash")}<');
page = page.replace('>Tarjeta<', '>{t("card")}<');
page = page.replace('>Transferencia<', '>{t("transfer")}<');
page = page.replace('>Seleccionar Cliente (Opcional)<', '>{t("selectClient")}<');
page = page.replace('Cobrar (F12)', '{t("checkout")} (F12)');
page = page.replace('Cobrar', '{t("checkout")}');

fs.writeFileSync(file, page);
console.log('POS page translated!');
