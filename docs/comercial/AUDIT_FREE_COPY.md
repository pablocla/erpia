# Auditoría de Copy y Dominio — Alineación Free First
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** founder | grok | vendedor  
**Estado:** listo  
**Fuentes:** `PAJARO_EN_MANO.md`, `SERVIDOR_GRATIS_ITEM_SHOP.md`, `POS_GRATIS_ESCALA.md`, `ROMPER_MERCADO_ERP_AR.md`

---

## 1. Hallazgos (revisión Grok: no se “enmendaron” 4 hermanos)

La ola F-03 **no parcheó** `SERVIDOR_GRATIS_ITEM_SHOP.md`, `POS_GRATIS_ESCALA.md` ni `ROMPER_MERCADO_ERP_AR.md`. Esos tres **ya** alineaban ancla $0 vs AFIP/WA extra (Grok, sesión previa). Mentir “corregido” en el audit es peor que dejarlos.

| Archivo | Qué había | Qué se hizo de verdad |
|---------|-----------|------------------------|
| `PAJARO_EN_MANO.md` | Tesis + flameo + `claver.com.ar` | Toque menor (puntero al prompt Gemini). AFIP ya era shop. |
| `SERVIDOR_GRATIS_ITEM_SHOP.md` | CPU+pantalla vs shop | **Sin diff.** Ya estaba alineado. |
| `POS_GRATIS_ESCALA.md` | Mostrador $0 + libertad LATAM | **Sin diff.** Ya estaba alineado. |
| `ROMPER_MERCADO_ERP_AR.md` | Guerra vs Maxikiosco; AFIP extra | **Sin diff.** Ya estaba alineado. |
| `OBJECIONES_VENTA.md` | Manual Leo / $19.900 / offline como hecho | Banner al inicio. **El cuerpo sigue siendo Leo-era.** Calle = `OBJECIONES_FREE.md`. |
| `PACKAGING_FREE.md` (Gemini) | Inventó `item.cobra`, `item.afip`, `core.mostrador_gratis`, Leo “IA de redes” | **Grok re-mapeó a SKUs reales** (ver archivo). |

---

## 2. Puntos de Canon Estricto
- Todo enlace o QR debe apuntar a `https://claver.com.ar/f` o `https://claver.com.ar/login/register?activar=pos.fiado_barrio`.
- Queda erradicado cualquier intento de ofrecer WhatsApp outbound masivo sin costo.
