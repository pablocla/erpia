const fs = require('fs');

const file = 'app/dashboard/configuracion/page.tsx';
let page = fs.readFileSync(file, 'utf8');

if (!page.includes('useTranslations')) {
  page = page.replace('import { useAuthStore } from "@/lib/stores/auth-store"', 
    'import { useAuthStore } from "@/lib/stores/auth-store"\nimport { useTranslations } from "next-intl"');
}

if (!page.includes('const t = useTranslations("settings")')) {
  page = page.replace('export default function ConfiguracionPageContent() {\n  const', 'export default function ConfiguracionPageContent() {\n  const t = useTranslations("settings")\n  const');
}

// Settings replacements
page = page.replace(
  '<h1 className="text-3xl font-bold tracking-tight text-gradient">Configuración</h1>',
  '<h1 className="text-3xl font-bold tracking-tight text-gradient">{t("title")}</h1>'
);
page = page.replace('Información de la Empresa', '{t("companyInfo")}');
page = page.replace('Razón Social', '{t("businessName")}');
page = page.replace('Nombre de Fantasía', '{t("fantasyName")}');
page = page.replace('Condición Fiscal', '{t("taxCondition")}');
page = page.replace('>Dirección<', '>{t("address")}<');
page = page.replace('>Teléfono<', '>{t("phone")}<');
page = page.replace('Configuración Fiscal', '{t("fiscalSettings")}');
page = page.replace('Punto de Venta', '{t("salePoint")}');
page = page.replace('>Entorno<', '>{t("environment")}<');
page = page.replace('Producción', '{t("production")}');
page = page.replace('Homologación (Testing)', '{t("homologation")}');
page = page.replace('>Certificados<', '>{t("certificates")}<');
page = page.replace('Subir CRT', '{t("uploadCert")}');
page = page.replace('Subir KEY', '{t("uploadKey")}');
page = page.replace('>Guardar Cambios<', '>{t("save")}<');

// SECCIONES mapping in the global scope won't have access to 't' easily if it's outside a component.
// We'll leave the sidebar array in Spanish or we can translate it if it's inside the component, but SECCIONES is usually outside.
// The sidebar strings use "Empresa", "AFIP / Fiscal", "Usuarios". Let's try replacing them inside the JSX map.
page = page.replace('{sec.label}', '{t(sec.key === "empresa" ? "company" : sec.key === "afip" ? "fiscal" : "users")}');
page = page.replace('{sec.label}', '{t(sec.key === "empresa" ? "company" : sec.key === "afip" ? "fiscal" : "users")}');

fs.writeFileSync(file, page);
console.log('Configuracion page translated!');
