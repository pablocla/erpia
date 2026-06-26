# 15 — Portal stakeholder (`/claver-cliente`)

> Acceso de solo seguimiento para decisores del cliente — sin ERP operativo.

## Flujo

```mermaid
flowchart TB
  AN[Analista Claver Cloud] --> INV[POST stakeholders /implementation/id]
  INV --> U[Usuario rol stakeholder]
  INV --> MAIL[Email portal + password temp]
  U --> LOGIN[/claver-cliente/login]
  LOGIN --> RES[Resumen CCA + tickets + alertas]
  LOGIN --> TIK[Tickets detalle + comentarios]
  LOGIN --> SCR[Tablero Scrum + sprint activo]
  AN --> SP[Crear sprint / asignar ítems]
  SP --> SCR
```

## Qué ve el stakeholder

| Vista | Datos |
|-------|-------|
| Resumen | % CCA, fase, tickets abiertos, alertas ops, pasos cliente marketplace |
| Tickets | Lista + detalle + **comentarios propios** (POST) |
| Servicios | Backlog Scrum `visibilidadCliente: true` + **sprint activo** con fechas |

## APIs

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/claver-cliente/overview` | stakeholder |
| GET | `/api/claver-cliente/scrum` | stakeholder (`sprintActivo` + `items`) |
| GET | `/api/claver-cliente/tickets/:id` | stakeholder |
| POST | `/api/claver-cliente/tickets/:id/comentarios` | stakeholder |
| GET/POST/DELETE | `/api/claver/implementaciones/:id/stakeholders` | analista |
| GET/POST | `/api/claver/implementaciones/:id/scrum` | analista (`create_sprint`, `assign_sprint`) |

## Código

- `lib/ops/stakeholder-service.ts`
- `lib/ops/client-portal-service.ts`
- `lib/ops/ticket-stakeholder-service.ts`
- `lib/ops/scrum-service.ts` — `crearSprint`, `asignarItemASprint`, `getScrumResumenStakeholder`
- `lib/auth/stakeholder-guard.ts`
- `app/claver-cliente/*`
- `app/claver-cloud/implementation/[id]`

## Sprints (P3)

El analista crea sprints con nombre e intervalo de fechas. Al crear uno nuevo como activo, los anteriores se desactivan. Los ítems asignados pasan a estado `sprint` y el stakeholder los ve en la tarjeta **Sprint activo**.

## Notificaciones (P4)

| Evento | Destinatario | Canal |
|--------|--------------|-------|
| Stakeholder comenta ticket | Analistas asignados (+ `CLAVER_ANALYST_EMAILS`) | Email + Telegram |
| Analista/tenant responde ticket | Stakeholders activos del tenant | Email con link al portal |

Código: `lib/ops/ops-notificaciones.ts` — `notifyAnalistasComentarioStakeholder`, `notifyStakeholdersRespuestaTicket`

## Siguiente paso

→ [16 — Runbooks Premium e Impl](./16-runbooks-premium-impl.md) · [17 — Diagramas Tier 1](./17-runbooks-tier1-diagramas.md) · [18 — Enganches Tier 2](./18-runbooks-tier2-enganches-diagramas.md)