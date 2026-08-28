# Copy Spec — Landing Mobile-First `/f` (`claver.com.ar/f`)
**Fecha:** 2026-08-26  
**Owner:** grok  
**Para:** grok | frontend | tester | vendedor  
**Estado:** implementado en `app/f/page.tsx`  
**Fuentes:** `COBRAR_SOLO_PROBLEMA_RESUELTO.md` (manda) · `CANON_FREE.md`

El tobogán, tokens, y el **test lineal** están en `COBRAR_SOLO_PROBLEMA_RESUELTO.md` §3–§4.  
Oficios / empresa de servicio: **otra puerta** `app/f/servicios/page.tsx` (`/f/servicios`). No mezclar en el hero de `/f`.

---

## Bloques (orden de scroll)

1. **Badge:** `Gratis para siempre · Sin tarjeta` (verde menta)
2. **H1:** Tu negocio en el celular. / Caja, stock y fiado. Gratis.
3. **Sub:** Anotá ventas, controlá el stock y sabé quién te debe. Sin tarjeta, sin vencimiento.
4. **CTA:** `EMPEZAR GRATIS AHORA` → `/login/register?activar=pos.fiado_barrio` (+ `&ref=`)
5. **Micro:** El ticket y la libreta no vencen. WhatsApp de cobro y factura AFIP se activan cuando te hagan falta.
6. **Preview:** Quién me debe · Pérez $12.000 / García $4.500 / López $800
7. **3 bullets:** cuaderno / mostrador / celu
8. **Avisos:** “El sistema te avisa. Vos vendés.” + 4 frases. Pie: avisos en pantalla = gratis; WA al deudor = extra.
9. **$0 + por qué es gratis** + acordeón extras (sin catálogo)
10. **FAQ:** ¿trucho? / ¿tarjeta? / ¿AFIP? / ¿cierran?
11. **CTA #2:** mismo href
12. **Footer:** Términos · Privacidad · Partners

Header: logo + “Ya tengo cuenta” (`/login`). No es un segundo producto.

## 🚫 No mostrar
Mega menú, 11 apps, Free/Pro/Enterprise, tarjeta, “trial” junto a “gratis”, partners en el hero, catálogo antes del CTA de cierre.
