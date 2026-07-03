# Triage — Reporte Gemini QA (3 jul 2026)

**Entorno probado:** `localhost:3000`  
**Revisado por:** equipo dev (post-reporte)

---

## Veredicto general

El reporte es **útil como smoke test**. Los porcentajes son optimistas en capas con mock (MP, checkout marketplace `paid` sin cobro real). Varios hallazgos mezclan rutas correctas del demo con rutas alternativas del catálogo.

---

## Correcciones al reporte

| Hallazgo Gemini | Realidad en código | Acción |
|-----------------|-------------------|--------|
| Prestamista → `/dashboard/prestamos` | Demo debe ir a **`/dashboard/fiado`** (libreta con seeds). `/dashboard/prestamos` es cartera localStorage aparte. | **Corregido:** `goldenPath` prestamista = `/dashboard/fiado` |
| Gimnasio demo → `/dashboard/nicho/gimnasio` empty | Paquete **`gimnasio`** rutea a **`/dashboard/membresias`** con `seedGymDemo`. Nicho gym es app distinta (`gimnasio_barrio`). | Hint actualizado; seeds nicho si enganche `niche.gimnasio_barrio` |
| Obras “sin CTA” | Había empty state textual; botón en header + dialog. | **Corregido:** CTA prominente en empty state + guía 3 pasos |
| `/claver-cloud/tenants` | Lista = `/claver-cloud/organizations`; detalle = `/claver-cloud/tenants/[id]` | Actualizar playbook Gemini |
| signup_origen “a veces inferencia” | Esperado en históricos; nuevos altas ya etiquetan + inferencia CUIT `DEMO-*` | No es bug P0 |

---

## Vendible hoy (prometer en ventas)

- Hub marketing + `/demo` (6 paquetes destacados)
- Fiado / almacén, prestamista (libreta), consorcios (con seed edificio)
- Salón belleza / agenda con guía + link público (parcial)
- Gimnasio vía **membresías** (no nicho gym aislado)
- Registro web + trial 14d + torre admin registros
- Core ERP smoke (caja, ventas, stock, clientes, fiado)
- Marketplace checkout (activación SKU — pago simulado en dev)

## No prometer todavía

- Mercado Pago suscripción real (sandbox/webhook sin validar)
- Conteo individual de visitantes demo (tenant compartido)
- Agenda pública cliente final 100% self-service
- Premium 7 todos los intangibles en producción plena

---

## Cola operativa admin (accionar ya)

| Prioridad | Pendiente | Acción |
|-----------|-----------|--------|
| **P1** | Trials ≤3d en `/claver-cloud/registros` | +7d o llamada |
| **P1** | Altas web 7d con 0 SKUs | Impersonar → activar enganche desde tenant |
| **P1** | Leads pipeline etapa `trial` sin `empresaId` | Provisionar desde relevamiento |
| **P2** | MP checkout en mock | Configurar sandbox + webhook en staging |
| **P2** | Demos sin seed en rubros secundarios | Correr `seed-demo` o visitar paquete destacado |
| **P2** | Follow-ups vencidos en Command Center | Contactar hoy desde kanban |

---

## Fixes aplicados post-reporte

1. `prestamista` goldenPath → `/dashboard/fiado`
2. Seeds `nicheMovimiento` para obras, gym barrio, feria, remis, acopio en demo
3. Empty state nicho con botón CTA explícito
4. Guías 3 pasos: obras, feria, remis, acopio

---

## Segunda tanda Gemini (billing + P1 gym/obras/MP)

| P1 reportado | Estado post-fix |
|--------------|-----------------|
| Gym empty state | `NicheCuotasPanel` + seeds con clientes + enganche en demo gimnasio |
| Obras sin mock | Seeds `niche.obra_changas` + CTA empty state |
| MP mock activa SKU | Prod: `pending_payment` sin provisionar; dev: `paid` |
| Tour post-registro | Tour `variant=web` solo tras `/login/register` |
| Tabla registros mobile | Cards en `< md`, tabla en `≥ md` |

**Billing `/claver-cloud/billing`:** OK — MRR flota por tenant, enlace desde Command Center.

**Vendible corregido:** Gym y Obras pasan a *vendible con demo* tras re-provisionar `/demo/gimnasio` o activar SKU obras.

---

## Re-test sugerido para Gemini

```text
Repetí solo estos 5 flujos tras el deploy:
1. /demo/prestamista → debe abrir /dashboard/fiado con deudores seed
2. /demo/gimnasio → debe abrir /dashboard/membresias (NO nicho/gimnasio)
3. /demo/obra_changas o /dashboard/nicho/obras → debe tener registros seed o CTA visible
4. Registro web nuevo → visible en /claver-cloud/registros en <2 min
5. /dashboard/apps → checkout bundle → SKU activo en sidebar
```