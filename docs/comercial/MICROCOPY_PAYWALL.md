# Microcopy de Paywalls — Textos In-App
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** grok | ui/ux design  
**Estado:** listo  
**Fuentes:** `CANON_FREE.md`, `ITEM_SHOP_CATALOGO.md`

---

## Tabla de Microcopy In-App (Para Implementación en UI)

| Clave (Key) | Copy en es-AR (Tono Claro y Transparente) | Dónde se Ve (Ubicación UI) | Acción del Botón CTA |
|-------------|-------------------------------------------|----------------------------|-----------------------|
| `paywall.afip.modal_title` | **Facturación Electrónica AFIP** | Modal al hacer clic en "Emitir Factura A/B" | Abrir modal checkout |
| `paywall.afip.modal_body` | "El punto de venta y el ticket interno son gratis para siempre. Para emitir comprobantes oficiales AFIP, activá el módulo por mes." | Modal AFIP | *"Activar Facturación AFIP"* |
| `paywall.whatsapp.modal_title` | **WhatsApp de Cobranza Automático** | Al presionar "Enviar aviso por WhatsApp" | Modal checkout |
| `paywall.whatsapp.modal_body` | "Anotar el fiado en la pantalla es gratis. Para enviar avisos automáticos con link de Mercado Pago, sumá el paquete Cobrá." | Vista de Fiados / Deudores | *"Activar Envíos WhatsApp"* |
| `paywall.multicaja.modal_title` | **Agregar Segunda Caja** | Al presionar "Nueva Caja" en Configuración | Modal checkout |
| `paywall.multicaja.modal_body` | "El plan gratis incluye 1 caja registradora activa. Para cobros en simultáneo en otra pantalla, sumá una caja adicional." | Configuración de Cajas | *"Sumar 2ª Caja"* |
| `paywall.usuarios.modal_title` | **Límite de Usuarios Alcanzado** | Al crear un 3er usuario | Configuración de Usuarios | *"Ampliar Usuarios"* |
| `paywall.usuarios.modal_body` | "Tenés 2 usuarios incluidos en tu plan gratis. Para sumar cajeros adicionales con permisos restringidos, activá el extra." | Modal de Invitación de Usuario | *"Activar Usuarios Extra"* |
| `paywall.analytics.modal_title` | **Histórico Anual de Ventas** | Al seleccionar filtro > 48 horas o reporte de 12 meses | Vista de Analytics / Reportes | *"Desbloquear Reportes 12M"* |
| `paywall.analytics.modal_body` | "Los reportes del día y ayer son gratis. Para analizar tendencias de 12 meses y exportar datos, activá Analytics Avanzado." | Pantalla de Reportes | *"Activar Analytics"* |

---

## Reglas de Diseño de Paywalls
- **Tono No-Ransom:** Nunca bloquear datos del usuario ni hacer sentir que "le secuestramos" la libreta.
- **Diferenciación Clara:** "El ticket es gratis. La factura AFIP es el extra."
