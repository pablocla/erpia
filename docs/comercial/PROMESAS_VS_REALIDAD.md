# Promesas vs Realidad — Brecha de Código e Infraestructura
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** grok | fundador | vendedor  
**Estado:** listo  
**Fuentes:** `docs/comercial/CANON_FREE.md`, `docs/engineering/PROMPT_GEMINI_FREE.md`

---

## Brecha Operativa: Código Actual vs Oferta Comercial

| Módulo / Promesa Comercial | Estado en Código Hoy | Oferta Esperada (Ancla $0) | Acción Gemini (Doc / Copy) | Acción Grok (Código) |
|----------------------------|-----------------------|----------------------------|----------------------------|----------------------|
| **POS Mostrador 1 Caja** | Código actual enfocado en `pos.fiado_barrio` | POS rápido + 1 caja + ticket no fiscal | Vender como "Mostrador + Libreta gratis" | Extender `pos.fiado_barrio` a POSlite 1 caja |
| **Cuaderno Fiado & Deudas** | Funcional (`/dashboard/fiado`, SKU `pos.fiado_barrio`) | Fiado ilimitado | Pitch héroe **hoy** (esto sí se demo) | Mantener |
| **WhatsApp outbound** | Extra `com.whatsapp` / Cobrá | Item shop | Extra de pago | **0 envíos** si no hay SKU; paywall en el botón |
| **AFIP prod** | Backend `lib/afip` existe; no está capado al ancla | Item shop | Extra | Paywall emisión A/B/C; ticket interno sigue |
| **Multicaja** | Sin tope estricto | Item shop | Extra | Cap 1 caja / `empresaId` en ancla |
| **Usuarios** | Sin tope estricto | Máx 2 en $0 | Extra el 3º | Cap en API invite |
| **Landing `/f`** | **Ya existe:** rewrite a `/login/register?activar=pos.fiado_barrio` | Página corta mobile-first (spec `COPY_LANDING_F.md`) | Copy listo | **No crear otra ruta.** Reemplazar el rewrite por la landing o dejar rewrite hasta HUM. |
| **Purge 90 d** | No hay job | Freeze (no ransom de datos) | Playbook listo | Job `congelado` + avisos D75/D90 |

---

## Regla de Oro para Vendedores

> **Nunca prometas en la calle lo que el tenant no tiene cableado.**  
> Hoy el héroe demo es **fiado**. AFIP y WhatsApp automático: *"La libreta es gratis. Eso es extra, lo prendés cuando te duela."*
