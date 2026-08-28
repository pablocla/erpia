# Estructura de Menú — Navegación Ancla vs Item Shop
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** grok | ui/ux design  
**Estado:** listo  
**Fuentes:** `CANON_FREE.md`, `ITEM_SHOP_CATALOGO.md`

---

## Matriz de Visibilidad en Menú Sidebar

| Opción de Menú | Visible en Plan Gratis ($0) | Visible en Cajero | Visible con Extra Activado |
|----------------|-----------------------------|-------------------|----------------------------|
| 🛒 **Cobrar (POS)** | Sí | Sí | Sí |
| 📖 **Fiados / Deudores** | Sí | Sí | Sí |
| 📦 **Productos & Stock** | Sí | No (Lectura sola) | Sí |
| 💵 **Cierre de Caja** | Sí | Sí | Sí |
| 📊 **Ventas Hoy / Ayer** | Sí | No | Sí |
| 💬 **Cobranza WhatsApp** | Con Insignia 🔒 "Extra" | No | Sí (Desbloqueado) |
| 🧾 **Facturación AFIP** | Con Insignia 🔒 "Extra" | No | Sí (Desbloqueado) |
| ⚙️ **Configuración Cajas/Users**| Sí (Restringido a 1/2) | No | Sí |

---

## Directiva de Diseño para Grok
- Mantener la navegación del cajero **sumamente limpia**, ocultando elementos administrativos.
- Las opciones que pertenecen al Item Shop deben figurar con un ícono sutil de candado 🔒 o badge de "Extra", llevando directo al modal de activación sin romper la navegación.
