# Sprint comercial — Home que vende un problema, no un ecosistema

> **Contexto (jul 2026):** ChatGPT entró a [claver.com.ar](https://claver.com.ar) y diagnosticó lo mismo que el repo ya documentó en Bloque 2 de `prompt-gemini-go-to-market.md`: la home comunica demasiado (ERP + IA + Cloud + 12 líneas de negocio) y el dueño de kiosco/ferretería/veterinaria no ve en 3 segundos **qué problema concreto le resolvés**.
>
> **Disyuntiva:** impresionar al técnico vs convertir al dueño de negocio. Para salir al mercado, gana el dueño. El ecosistema va **después**, como expansión natural.

---

## Estado actual: producción vs repo

| Aspecto | claver.com.ar (prod, atrasada) | Repo local (main) |
|---------|-------------------------------|-------------------|
| Hero | "Tecnología que ordena tu negocio" + ERP/POS/40 módulos | "Tu negocio, más fácil" + POS genérico |
| Catálogo visible | 12+ líneas (Cloud, ERP, Fiado, ClavAI, Bridge…) | "Empezá con un solo problema" + 3 combate |
| Demos | 6 rubros arriba del fold | 6 rubros + packs + plataformas |
| CTA principal | Trial genérico | Trial genérico |
| GTM | No existe `COMBATE_APPS` | `fiado`, `cobra`, `turnos` en `go-to-market-vitrine.ts` |

**Conclusión:** el diagnóstico de ChatGPT es correcto para producción. El repo **ya empezó** el pivot pero (a) no está deployado, (b) el hero sigue siendo POS genérico, (c) debajo de las 3 apps de combate todavía hay packs, plataformas y banner de catálogo completo — en mobile el visitante sigue viendo "plataforma infinita" antes de hacer scroll decisivo.

---

## Objetivo del sprint (2 semanas)

1. **Un proceso en el hero** — el visitante entiende el dolor en <5 s.
2. **Tres productos de combate above the fold** — Fiado, Cobrá, Turnos con CTA `?activar=`.
3. **Ecosistema colapsado** — ERP, Cloud, packs y demos completos detrás de "Ver más".
4. **Deploy a producción** — cerrar el gap prod/repo.
5. **Métrica:** % de visitas que llegan a `/login/register?activar=` (no solo `/login/register?trial=14`).

---

## PROMPT MAESTRO (pegar primero)

```
Sos desarrollador senior + product marketer en pos-system-argentina (Next.js 15, TypeScript, Prisma, shadcn, Tailwind v4, Vitest).

Objetivo del sprint: la home de Claver vende UN problema concreto primero; el conglomerado queda como expansión.

Reglas:
- Locale es-AR, copy directo (dueño de negocio, no CTO)
- No inventar SKUs ni productos nuevos
- Reutilizar: lib/comercial/go-to-market-vitrine.ts, commercial-packaging.ts, sub-saas-catalog.ts
- Cambios mínimos; no refactorizar ERP
- Tests Vitest en lógica de copy/routing (no en JSX decorativo)
- Mobile-first: lo crítico antes del primer scroll en 390px

PROHIBIDO en este sprint:
- Mercado Pago suscripción real
- Activación en login de usuario existente
- Reescribir landings /claver/claverp entera

Al terminar cada bloque reportá:
1. Archivos tocados
2. Cómo probar en local (3 pasos)
3. Qué quedó fuera
4. Copy final del hero (texto literal)
```

---

## BLOQUE S0 — Deploy urgente (cerrar gap prod)

```
BLOQUE S0 — Subir a producción lo que ya está en main

Problema: claver.com.ar muestra landing antigua ("Líneas de negocio Claver" con 12 cards).

Tareas:
1. Verificar que app/page.tsx renderiza ClaverMatrixHub (no componente legacy)
2. Deploy a Vercel / pipeline habitual
3. Smoke test post-deploy: hero ≠ "Tecnología que ordena tu negocio"
4. Confirmar sección "Productos de Combate" visible

Criterio: curl o fetch a https://claver.com.ar contiene "Productos de Combate" o "Empezá con un solo problema".
```

---

## BLOQUE S1 — Hero por dolor (no por plataforma)

```
BLOQUE S1 — Un proceso, una promesa

Problema: "Tu negocio, más fácil" + POS genérico no responde "¿qué me resolvés a MÍ?".

Decisión de producto (no negociable en sprint):
- Hero default = Claver Fiado (dolor más universal en calle: "¿quién me debe y cuánto?")
- Alternativas por query: ?dolor=fiado | cobra | turnos | pos

Tareas:
1. Extender lib/comercial/go-to-market-vitrine.ts:
   - HERO_VARIANTS: Record<DolorSlug, { h1, subtitle, ctaLabel, ctaHref, trustBullets }>
   - Default: fiado
2. components/marketing/claver-matrix-hub.tsx:
   - Leer searchParams (wrapper server o client con useSearchParams)
   - Renderizar hero desde HERO_VARIANTS[slug]
   - CTA primario → /login/register?activar=pos.fiado_barrio (o SKU del dolor)
   - CTA secundario → #combate-heading (no #entrada genérico)
3. Quitar o reducir LogoShowcase en hero (ocupa fold sin vender)
4. Trust bullets específicos del dolor (ej. fiado: "Libreta digital", "WhatsApp de cobro", "Trial 14 días")

Copy sugerido fiado (baseline):
- h1: "Sabé quién te debe, sin libreta."
- subtitle: "Anotá fiados en el mostrador, mandá recordatorios por WhatsApp y cobrá más rápido."
- CTA: "Probar Fiado gratis"

Criterio: en / sin params, h1 menciona deuda/fiado; en /?dolor=cobra habla de cobranza.
Test: __tests__/comercial/hero-variants.test.ts
```

---

## BLOQUE S2 — Home corta (progressive disclosure)

```
BLOQUE S2 — Menos scroll, más decisión

Problema: después de combate siguen PacksRubro, Plataformas, CatalogoCompleto, 6 demos — repite el error de prod.

Tareas:
1. Reordenar claver-matrix-hub.tsx:
   Orden mobile:
   a) Hero (dolor)
   b) ProductosEntradaSection (2–3 cards)
   c) SubSaasAppsSection combateOnly
   d) Collapsible "¿Necesitás más? Ver demos, packs y ERP" → dentro: demos + PacksRubro + Plataformas
   e) FAQ
   f) CTA final
2. CatalogoCompletoBanner → solo dentro del collapsible, con copy "Para empresas que ya superaron un solo proceso"
3. commercial-catalog-sections.tsx: prop `defaultOpen` en Collapsible; contador "47 soluciones" NO visible en home (solo en /claver/apps)
4. SubSaasAppsSection: quitar botón "Ver las N apps" del header en home (link al final del collapsible)

Criterio: en viewport 390×844, usuario ve hero + 3 cards combate sin scroll.
Test visual manual documentado en PR.
```

---

## BLOQUE S3 — Selector de dolor en hero (sin 23 landings)

```
BLOQUE S3 — "¿Cuál es tu mayor dolor?" — 3 chips

Problema: un solo hero fiado pierde a quien busca turnos o cobranza.

Tareas:
1. components/marketing/hero-dolor-chips.tsx:
   - 3 chips: Fiado | Cobranza | Turnos
   - Cambian URL ?dolor= sin reload pesado (router.replace)
   - Accesible: aria-pressed, keyboard
2. Integrar debajo del subtitle en hero
3. Persistir último dolor en sessionStorage para CTA "Crear cuenta" coherente
4. metadata dinámica (title/description) por dolor en app/page.tsx generateMetadata si es server component, o layout metadata estático por variante principal

Criterio: tap en "Cobranza" cambia h1 y CTA a intang.cobranzas_wa en <300ms percibido.
```

---

## BLOQUE S4 — Landings de combate = extensión del hero

```
BLOQUE S4 — /claver/apps/[slug] cierra la venta

Problema: hero empuja a landing que puede contradecir el mensaje (muy técnica o muy ERP).

Tareas:
1. Auditar app/claver/apps/[slug]/page.tsx para fiado, cobra, turnos
2. Cada landing debe tener:
   - Mismo h1 que hero variant (consistencia)
   - 3 bullets de resultado (no features técnicas)
   - Mockup o screenshot del dashboard producto (product-dashboard-home)
   - CTA único: Probar 14 días → register?activar=
   - Sección "Después podés sumar" con 2 links max (factura AFIP, stock) — colapsada
3. lib/comercial/sub-saas-catalog.ts: alinear lema de fiado/cobra/turnos con HERO_VARIANTS (una sola fuente si es posible)

Criterio: flujo hero fiado → landing fiado → register lleva modoLite fiado sin ver sidebar ERP completo.
```

---

## BLOQUE S5 — Funnel registro y analytics

```
BLOQUE S5 — Medir qué dolor convierte

Tareas:
1. lib/analytics/tracking.ts (o crear evento mínimo):
   - landing_hero_view { dolor }
   - landing_cta_click { dolor, destino }
   - signup_start { activar, utm }
2. Todos los CTAs de home usan ?activar= explícito (no trial genérico)
3. app/login/register/page.tsx: mostrar nombre del producto activado arriba del form ("Estás probando Claver Fiado")
4. docs/comercial/sub-saas-apps.md: tabla UTM sugeridos por campaña

Criterio: registro desde home fiado deja empresa con productosSku incluyendo pos.fiado_barrio.
Test: __tests__/comercial/activar-intent.test.ts (ya existe, extender si hace falta).
```

---

## BLOQUE S6 — Demos por rubro = secundario, no competidor del hero

```
BLOQUE S6 — Demos no roban el mensaje principal

Problema: en prod, "Probá tu rubro" compite con el hero — el visitante se va a /demo/almacen sin entender qué compra.

Tareas:
1. Reducir LANDING_FEATURED_DEMOS en home a 3 (almacén/fiado, salón/turnos, consorcios) dentro del collapsible
2. Copy del bloque: "¿Querés ver cómo se siente? Demo con datos de ejemplo" — tono secundario
3. Cada demo card: badge "Demo" + link pequeño; NO igual peso visual que Productos de Combate
4. /demo sigue con catálogo completo para SEO

Criterio: Productos de Combate tienen cards más grandes que demo cards en la misma página.
```

---

## BLOQUE S7 — WhatsApp y contacto alineados al dolor

```
BLOQUE S7 — Un mensaje de ventas, no "hola quiero Claver"

Tareas:
1. components/marketing/claver-ventas-contacto.tsx:
   - WA link con texto prellenado según dolor activo: "Hola, quiero probar Claver Fiado en mi almacén"
2. /claver/contacto: dropdown "¿Qué te interesa?" fiado | cobra | turnos | ERP
3. lib/whatsapp/ventas-bot.ts: intención inicial por keyword fiado/cobro/turno

Criterio: desde home con ?dolor=fiado, botón WA abre chat con mensaje que menciona Fiado.
```

---

## Orden de ejecución recomendado

```
S0 (deploy) → S1 (hero) → S2 (home corta) → S3 (chips) → S5 (funnel)
     ↓ paralelo
S4 (landings) + S6 (demos) + S7 (WA)
```

**P0 esta semana:** S0 + S1 + S2 — eso solo ya responde al feedback de ChatGPT.

**P1 semana 2:** S3 + S4 + S5.

**P2:** S6 + S7 + A/B de copy (fiado vs cobra como default).

---

## Qué NO hacer (anti-patrones)

| Temptación | Por qué evitarla |
|------------|------------------|
| Listar las 12 líneas de negocio en home | Confunde; parece que vendés consultora + ERP + IA + bridge |
| Hero "ERP Argentina con 40 módulos" | Atrae comparadores de ERP, no dueños con un dolor hoy |
| CTA "Ver precios" que lleva a /claver/claverp/precios | Tabla enorme; matar conversión sub-SaaS |
| Una landing distinta por cada rubro (23) | Mantenimiento imposible; usar ?dolor= + demos |
| Ocultar el ERP para siempre | Pérdida de upsell; mostrarlo como "cuando crezcas" |

---

## KPIs del sprint

| Métrica | Baseline (estimado prod) | Meta |
|---------|--------------------------|------|
| Bounce rate home | alto (mensaje difuso) | −20% |
| Click CTA primario / sesión | bajo | ≥8% |
| Registros con `?activar=` | ~0% | ≥60% de signups desde home |
| Time to first scroll | <3s sin entender | usuario lee h1 completo |
| Trial → 1ª acción producto (fiado creado, etc.) | desconocido | ≥40% día 1 |

---

## Mensaje para stakeholders (1 párrafo)

Claver **no es más chico** — es **más claro**. La home deja de ser el mapa del conglomerado y pasa a ser la puerta de un proceso: fiado, cobranza o turnos. Todo lo demás (ERP, Cloud, packs por rubro, IA) sigue existiendo para quien ya confía, pero no compite con la primera impresión. Eso es lo que ChatGPT vio en producción y lo que el repo ya intuía con `COMBATE_APPS`; falta deploy + hero con dolor explícito + home más corta.

---

## Referencias en repo

- `components/marketing/claver-matrix-hub.tsx` — home actual
- `lib/comercial/go-to-market-vitrine.ts` — combate + copy (extender aquí)
- `docs/comercial/prompt-gemini-go-to-market.md` — Bloques 1–8 operativos post-home
- `docs/comercial/prompt-gemini-ux-ui.md` — UX post-login (product shell, checklist)
- `lib/comercial/commercial-packaging.ts` — PRODUCTOS_ENTRADA, packs