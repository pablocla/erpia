# Engineering backlog — Cascada W0→W4 (repo + UI cool)

## El cuello de botella (y la solución)

| Enfoque | ¿Grok Build lo lee? | ¿UI? | Veredicto |
|---------|---------------------|------|-----------|
| Solo Postgres | **No** | Sí | Cuello de botella |
| **Catálogo + status en git** | **Sí** | Cascada / critical path | **Elegido** |

```text
  wave W0→W4  +  blockedBy (DAG)  +  ★ critical path → $ recuperados
        │
  catalog.ts  +  backlog-status.json
        │
  /dashboard/engineering/backlog  ·  GET format=agent
        │
  Grok: read_file (nunca DB)
```

## Cascada + assignees + lifecycle

- **`wave`**: ola W0…W4
- **`blockedBy`**: DAG (locked hasta prereqs done)
- **`assignee`**: `grok` | `gemini` | `pair` | `human` → ver `ASSIGNMENT.md`
- **`lifecycle`**: foundation → build → comercial → onboarding → implementacion → go_live → postventa → growth → scale
- **`onCriticalPath`**: cadena a pesos recuperados (ED-04 / ED-13)

### Colas duales

| Agente | Prompt UI | Archivo cola |
|--------|-----------|--------------|
| Grok Build | Prompt Grok | tickets `assignee=grok` |
| Gemini | Prompt Gemini | `GEMINI_QUEUE.md` |

## UI

- `/dashboard/engineering/backlog` — **Engineering Cascade**
  - Pipeline de olas con % done
  - Vista **Cascada** por wave × depth
  - Filtro **Critical path ★**
  - Botón **Prompt Grok**

## API

- `GET /api/engineering/backlog` → tickets + waves + edges + next
- `GET /api/engineering/backlog?format=agent` → markdown para pegar
- `PATCH` → escribe `backlog-status.json` (commitear en local)

## Cómo arrancar con Grok

```text
Leé docs/engineering/PRODUCT_BACKLOG.md + backlog-status.json.
Implementá el primer P0 W1 con cascadeBlocked=false.
Al terminar: status done + commit del JSON.
```

## Qué NO es

| Sistema | Uso |
|---------|-----|
| `Ticket` soporte | Bugs de clientes |
| Scrum Cloud | Implementación por tenant |
| CEO roadmap | Checklist fundador |
| **Este backlog** | Gaps de **producto monorepo** |
