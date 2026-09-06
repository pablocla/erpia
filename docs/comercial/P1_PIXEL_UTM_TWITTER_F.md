# P1-C / P1-E — Marketing → Eng (CTO)
Scope: `/f` + register funnel Fiado. Antes de volumen Meta.
Owner copy/naming: Marketing. Owner install: CTO (coord Producto).

---

## P1-E — Twitter / OG `/f` (copy)

Alinear title/description al ancla Fiado (no ERP genérico / no “caja+stock” como promesa día 1).

| Meta | Valor |
|------|--------|
| `og:title` / `twitter:title` | `Libreta de fiados gratis · Claver` |
| `og:description` / `twitter:description` | `Anotá quién te debe, sin tarjeta. Caja y factura oficial las sumás después.` |
| `og:url` | `https://claver.com.ar/f` |
| `twitter:card` | `summary_large_image` |
| Document title (`<title>`) | `Libreta de fiados gratis · Claver` |

Evitar en title/desc: ERP, gestión integral, CAE, ARCA sin glosa, “sistema completo”.

---

## P1-C — Pixel / gtag + eventos + UTMs

### Stack mínimo (piloto)
1. Meta Pixel (fbq) en `/`, `/f`, `/login/register` (+ CAPI server-side cuando haya endpoint; no bloquear piloto por CAPI).
2. gtag GA4 opcional mismo footprint; no requerido para arrancar Meta.
3. Sin Pixel observable = **no subir volumen** de ads.

### Eventos (nombres estándar Meta)

| Evento | Dónde | Cuándo | Params sugeridos |
|--------|--------|--------|------------------|
| `PageView` | todas las páginas con Pixel | load | — |
| `ViewContent` | `/f` | load de `/f` | `content_name: Claver Fiado`, `content_category: fiado`, `content_ids: [pos.fiado_barrio]` |
| `Lead` | click CTA primario “Empezar gratis” en `/f` (y home si apunta al mismo funnel) | click (antes de navegar) | `content_name: Empezar gratis`, `content_category: fiado` |
| `CompleteRegistration` | `/login/register` éxito (cuenta creada) | success callback | `content_name: Claver Fiado`, `status: true` |
| `StartTrial` (custom o `Subscribe` si prefieren) | post-register cuando `activar=pos.fiado_barrio` queda activo | onboarding land | `value` omitir en gratis; `currency: ARS` |

No disparar `Purchase` en trial $0.

### UTMs obligatorios en ads → `/f`

Plantilla:
`https://claver.com.ar/f?utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`

Convención nombres (piloto):
- campaign: `fiado_w1_piloto`
- adset: `ar_25-54_comercio` (edad/geo)
- ad: `reel_deudor_v2` (creativo)

Persistir UTMs a first-party (cookie/localStorage) hasta register para atribución interna.

### QA Marketing (antes de volumen)
- [ ] Extensión Pixel Helper: PageView + ViewContent en `/f`
- [ ] Click CTA → Lead
- [ ] Registro test → CompleteRegistration
- [ ] Twitter Card Validator / compartir link: title Fiado, no ERP
- [ ] Ads Manager: UTMs en URL final del anuncio

— Marketing Claver · 2026-09-06
