# Prompt para dividir trabajo Sub-SaaS con Gemini

Copiá el bloque siguiente en Gemini (o otro modelo) para repartir las 10 apps entre sesiones paralelas. Cada bloque es independiente y tiene contexto suficiente.

---

## PROMPT MAESTRO (pegar primero)

```
Sos un desarrollador senior en el repo pos-system-argentina (Next.js 15, App Router, TypeScript, Prisma, Tailwind v4, shadcn).

Contexto ya implementado:
- Catálogo: lib/comercial/sub-saas-catalog.ts (10 apps, SUB_SAAS_SLUGS)
- Landings: app/claver/apps/[slug]/page.tsx + components/marketing/sub-saas-landing.tsx
- Menú QR público: app/api/menu-publico/[empresaId]/route.ts + app/menu/[empresaId]/page.tsx
- Vitrina: components/marketing/commercial-catalog-sections.tsx (SubSaasAppsSection)
- Docs: docs/comercial/sub-saas-apps.md

Reglas del proyecto (AGENTS.md):
- Multi-tenant: getAuthContext() + whereEmpresa() en APIs autenticadas
- Locale es-AR, moneda ARS, fechas dd/mm/yyyy
- No refactorizar fuera del scope
- Tests con Vitest en __tests__/

Tu tarea es SOLO el bloque que te asigno abajo. Al terminar:
1. Listá archivos tocados
2. Indicá % listo actualizado si cambió
3. Propuesta de copy para Reel (1 línea)
4. Qué falta para llegar a producción

No inventes SKUs nuevos. Usá los del catálogo.
```

---

## BLOQUE A — Fiado + Cobrá (prioridad ventas)

```
BLOQUE A — Fiado + Cobrá

Apps: slug `fiado` (pos.fiado_barrio) y `cobra` (intang.cobranzas_wa)

Objetivo: llevar de 90%/85% a producción comercial.

Tareas:
1. Fiado: página pública de estado de cuenta por token o link corto (similar a agenda-publica)
   - API: app/api/fiado-publico/[token]/route.ts (solo lectura)
   - UI: app/fiado/[token]/page.tsx
2. Cobrá: dashboard widget "deuda recuperable estimada" en cuentas-cobrar
3. Onboarding: al activar SKU desde landing, pre-cargar plantilla WA según rubro
4. Test: __tests__/comercial/fiado-cobra-public.test.ts
5. Actualizar listoPct en sub-saas-catalog.ts si corresponde

Archivos base:
- lib/fiado/fiado-service.ts
- lib/marketplace/cobranzas-wa-service.ts
- app/dashboard/fiado/page.tsx
- app/dashboard/cuentas-cobrar/page.tsx
```

---

## BLOQUE B — Turnos + Tienda

```
BLOQUE B — Turnos + Tienda

Apps: slug `turnos` (niche.peluqueria_barrio) y `tienda` (ECOM-B2C-01)

Objetivo: embellecer vista pública y reducir pasos de activación.

Tareas:
1. Turnos: branding en agenda-online/[empresaId] (logo empresa, colores)
2. Turnos: recordatorio WA post-reserva si com.whatsapp activo
3. Tienda: CTA desde landing que lleva a wizard slug en /dashboard/ecommerce
4. Tienda: Open Graph por slug en app/tienda/[slug]
5. Tests de smoke para APIs públicas existentes

Archivos base:
- app/agenda-online/[empresaId]/page.tsx
- app/api/agenda-publica/[empresaId]/route.ts
- app/tienda/[slug]/page.tsx
- lib/ecommerce/store-config-service.ts
```

---

## BLOQUE C — Menú QR + Presupuestos

```
BLOQUE C — Menú QR + Presupuestos

Apps: slug `menu-qr` y `presupuestos`

Menú ya tiene API y página pública básica. Falta pulir.

Tareas:
1. Menú: soporte imagen por plato (campo existente en producto si hay)
2. Menú: generador de QR en dashboard hospitalidad/platos (link a /menu/{empresaId})
3. Presupuestos: link público de solo lectura /presupuesto/[id]/[hash]
4. Presupuestos: PDF downloadable desde link público
5. Subir listoPct menu-qr a 70%, presupuestos a 75%

Archivos base:
- app/menu/[empresaId]/page.tsx
- app/api/menu-publico/[empresaId]/route.ts
- lib/ventas/presupuesto-service.ts
- app/dashboard/hospitalidad/platos (o page equivalente)
```

---

## BLOQUE D — Contenido IA + Bot WA

```
BLOQUE D — Contenido IA + Bot WA

Apps: slug `contenido-ia` (gen.content.redes_rubro) y `bot-wa` (com.whatsapp)

Tareas:
1. Contenido: pantalla dedicada /dashboard/contenido-redes (wrapper sobre generative)
2. Contenido: export CSV de copies + grilla mensual
3. Bot WA: CRUD plantillas en /dashboard/configuracion/whatsapp
4. Bot WA: 5 plantillas seed por rubro (almacén, peluquería, gastronomía)
5. Documentar variables de plantilla en docs/comercial/sub-saas-apps.md

Archivos base:
- lib/marketplace/generative-catalog.ts
- lib/whatsapp/whatsapp-service.ts
- app/api/webhooks/whatsapp/route.ts
```

---

## BLOQUE E — Stock + Puntos

```
BLOQUE E — Stock + Puntos

Apps: slug `stock` y `puntos` (niche.gimnasio_barrio)

Tareas:
1. Stock: modo "solo inventario" — ruta /dashboard/inventario-rapido con cámara
2. Stock: alertas de quiebre visibles en landing (dato real del API productos)
3. Puntos: flujo alta socio con DNI en tablet (UI simplificada)
4. Puntos: listado cuotas vencidas + botón WA (reusa cobranzas-wa)
5. Tests vitest para flujos mínimos

Archivos base:
- components/pos/pos-barcode-camera.tsx
- app/dashboard/membresias/page.tsx
- app/api/membresias/route.ts
```

---

## BLOQUE F — Marketing y SEO (transversal)

```
BLOQUE F — Marketing transversal

Sin tocar lógica de negocio pesada.

Tareas:
1. JSON-LD SoftwareApplication en cada landing /claver/apps/[slug]
2. Sitemap: incluir SUB_SAAS_SLUGS
3. 10 hooks de Reel en docs/comercial/reels-sub-saas.md (tabla slug + guion 15s)
4. Screenshots mockup en components/marketing/ (1 por app, estilo claverp-dashboard-mockup)
5. A/B copy: variantes de lema en sub-saas-catalog (comentario, no duplicar slugs)

Solo modificar: app/claver/apps/[slug]/page.tsx, lib/comercial/sub-saas-catalog.ts (copy), docs/
```

---

## Cómo repartir en paralelo

| Sesión Gemini | Bloque | Dependencias |
|---------------|--------|--------------|
| 1 | A | Ninguna |
| 2 | B | Ninguna |
| 3 | C | Menú base ya hecho |
| 4 | D | WhatsApp config existente |
| 5 | E | Ninguna |
| 6 | F | Landings ya hechas |

Orden sugerido si es secuencial: **A → C → B → D → E → F**

## Verificación final (todas las sesiones)

```bash
pnpm vitest run __tests__/comercial/sub-saas-catalog.test.ts
pnpm exec tsc --noEmit 2>&1 | head -40
```

Cada sesión debe confirmar que su slug responde 200 en `/claver/apps/{slug}`.