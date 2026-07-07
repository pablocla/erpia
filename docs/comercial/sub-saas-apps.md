# Sub-SaaS Claver — 10 apps empaquetadas

Fuente de verdad en código: `lib/comercial/sub-saas-catalog.ts`  
Landings públicas: `/claver/apps/[slug]`  
Componente: `components/marketing/sub-saas-landing.tsx`

## Filosofía

- **Un problema, un producto, un precio.** Trial 14 días.
- **Reciclaje de código:** cada app apunta a servicios y pantallas del ERP existente.
- **Modo lite:** al activar el SKU, el sidebar se reduce vía `modoLite` + `lite-sidebar.ts`.
- **Celular + PC:** el panel del dueño es responsive; algunas apps priorizan celular.

## Catálogo

| Slug | Marca | SKU principal | Precio ARS/mes | Listo | Estado | Panel | Vista pública |
|------|-------|---------------|----------------|-------|--------|-------|---------------|
| `cobra` | Claver Cobrá | `intang.cobranzas_wa` | $20.000 | 85% | disponible | `/dashboard/cuentas-cobrar` | WA al deudor |
| `fiado` | Claver Fiado | `pos.fiado_barrio` | $4.990 | 90% | disponible | `/dashboard/fiado` | Notificación deuda |
| `turnos` | Claver Turnos | `niche.peluqueria_barrio` | $3.990 | 75% | disponible | `/dashboard/agenda` | `/agenda-online/{empresaId}` |
| `tienda` | Claver Tienda | `ECOM-B2C-01` | $34.900 | 70% | disponible | `/dashboard/ecommerce` | `/tienda/{slug}` |
| `presupuestos` | Claver Presupuestos | `core.claver` | Incluido | 60% | beta | `/dashboard/ventas/presupuestos` | PDF/link (roadmap) |
| `menu-qr` | Claver Menú | `core.claver` | Incluido | 55% | beta | `/dashboard/hospitalidad/platos` | `/menu/{empresaId}` |
| `contenido-ia` | Claver Contenido | `gen.content.redes_rubro` | $30.000 | 50% | beta | `/dashboard/apps` | Export desde panel |
| `bot-wa` | Claver Bot | `com.whatsapp` | $15.000 | 35% | beta | `/dashboard/configuracion` | Chat WA |
| `stock` | Claver Stock | `core.claver` | Incluido | 55% | beta | `/dashboard/productos` | — |
| `puntos` | Claver Puntos | `niche.gimnasio_barrio` | $4.990 | 45% | beta | `/dashboard/membresias` | DNI en mostrador |

## Rutas implementadas

```
/claver/apps              → marketplace (incluye sección #subsaas)
/claver/apps/[slug]       → landing por app (SSG con generateStaticParams)
/login?activar={sku}      → activación trial
/menu/{empresaId}         → carta QR pública (nuevo)
/api/menu-publico/{id}    → API pública de platos
/agenda-online/{id}       → turnero (ya existía)
/tienda/{slug}            → tienda (ya existía)
```

## Activación (puente comercial → producto)

1. Usuario entra a landing → CTA `Probar 14 días gratis`.
2. Redirect a `/login?activar={sku|slug}`.
3. **Login/register** muestran la marca del producto (no “ERP genérico”).
4. **Registro** llama `applyRetailOnboarding` con el SKU y setea `modoLite`.
5. Entra directo a `dashboardPath` del producto (ej. `/dashboard/fiado`).
6. Sidebar filtrado con `filterMenuItemsByModoLite` + banner “Estás usando Claver Fiado”.

Resolver intent: `lib/comercial/activar-intent.ts`

### Riesgo si no hay activación

Sin `?activar=` el signup cae en `/dashboard` con `modoLite: completo` y el cliente **sí se pierde** en Claver. Por eso todas las landings deben usar `subSaasActivarHref()`.

## Backend por app (reciclado)

### cobra
- `lib/marketplace/cobranzas-wa-service.ts`
- `lib/whatsapp/whatsapp-service.ts`
- `app/api/webhooks/whatsapp/route.ts`

### fiado
- `lib/fiado/fiado-service.ts`
- `lib/fiado/fiado-whatsapp.ts`
- `app/dashboard/fiado/page.tsx`

### turnos
- `lib/agenda/agenda-service.ts`
- `app/api/agenda-publica/[empresaId]/route.ts`
- `app/agenda-online/[empresaId]/page.tsx`

### tienda
- `lib/ecommerce/store-config-service.ts`
- `app/tienda/[slug]/page.tsx`
- `app/api/ecommerce/tienda/[slug]/route.ts`

### menu-qr (nuevo en esta entrega)
- `app/api/menu-publico/[empresaId]/route.ts`
- `app/menu/[empresaId]/page.tsx`
- Panel: `app/api/hospitalidad/platos/route.ts`

### presupuestos
- `lib/ventas/presupuesto-service.ts`
- `app/dashboard/ventas/presupuestos/page.tsx`

### contenido-ia
- `lib/marketplace/generative-catalog.ts` (SKU `gen.content.redes_rubro`)

### bot-wa
- `lib/whatsapp/whatsapp-service.ts`
- `app/api/webhooks/whatsapp/route.ts`

### stock
- `components/pos/pos-barcode-camera.tsx`
- `app/dashboard/pos/page.tsx`

### puntos
- `app/dashboard/membresias/page.tsx`
- `app/api/membresias/route.ts`

## Roadmap por app

| App | Falta para 100% |
|-----|-----------------|
| cobra | Intents automáticos, métricas de recuperación en landing |
| fiado | Link público de estado de cuenta |
| turnos | Recordatorios WA out-of-the-box sin config extra |
| tienda | Onboarding slug en 1 paso desde landing |
| presupuestos | Link público firmable del PDF |
| menu-qr | Fotos de platos, alérgenos, multi-idioma |
| contenido-ia | Export PNG/PDF directo desde grilla |
| bot-wa | Intents + catálogo de respuestas por rubro |
| stock | Flujo inventario solo-cámara sin POS completo |
| puntos | App socio (QR propio) |

## Tests

```bash
pnpm vitest run __tests__/comercial/sub-saas-catalog.test.ts
```

## Enlaces en vitrina

- Home (`ClaverMatrixHub`): sección destacada (6 apps).
- `/claver/apps`: las 10 apps en `#subsaas`.
- `PRODUCTOS_ENTRADA`: Fiado y Cobrá enlazan a su landing.