# Product Engineering Backlog — Cascade + Assignees

> **Catálogo:** `lib/engineering/product-backlog-catalog.ts`  
> **Estados:** `docs/engineering/backlog-status.json`  
> **Asignación:** `docs/engineering/ASSIGNMENT.md`  
> **Cola Gemini:** `docs/engineering/GEMINI_QUEUE.md`  
> **UI:** `/dashboard/engineering/backlog`

## Assignees

| Badge | Rol |
|-------|-----|
| **grok** | Grok Build — código monorepo |
| **gemini** | Docs, copy, playbooks, QA matrices, runbooks |
| **pair** | Gemini spec → Grok code |
| **human** | Precio, piloto, legal, ventas |

## Critical path ★ (pesos)

```text
AG-00(grok) ─┬─ ED-01(grok) → ED-02 → … → ED-08 → ED-09(pair)
             ├─ ED-03 → ED-04 ★ → ED-13 ★ recovery
             ├─ ED-05 → COM-01(gemini) / ED-06(pair)
             └─ ED-07 + ED-12 (grok)
```

## Ciclo de vida (lifecycle)

```text
foundation → build → comercial → onboarding → implementacion
    → go_live → postventa → growth → scale
```

| Life | Grok | Gemini | Human |
|------|------|--------|-------|
| build / foundation | ED-*, SEC, AUD code | QA-01, DOC | — |
| comercial | ED-05, billing hooks | COM-01…04, DOC-01 | HUM-01 |
| onboarding | ED-20, trial lock | ONB-01, DOC-02 | — |
| implementacion | IMP-02 scrum hooks | IMP-01, IMP-03 | — |
| go_live | GL-01 checks | GL-02 | HUM-02 piloto |
| postventa | PV-02 health, ED-13 | PV-01, PV-03, PV-04 | — |

## Colas paralelas (esta semana)

### Grok
1. ED-01 → ED-02  
2. ED-03 → ED-04  
3. ED-05, ED-07, ED-12  

### Gemini (mismo tiempo)
1. DOC-01 lifecycle audit  
2. COM-01 one-pager  
3. COM-02 + COM-03  
4. ONB-01 trial sequence  

### Human
- HUM-01 precio · HUM-02 elegir piloto  

## Prompt Grok

```text
Leé ASSIGNMENT.md + PRODUCT_BACKLOG.md + backlog-status.json.
Implementá primer grok/pair P0 W1 desbloqueado. Status done al cerrar.
```

## Prompt Gemini

```text
Leé ASSIGNMENT.md + GEMINI_QUEUE.md.
Ejecutá primer ticket gemini P0/P1. Solo docs/. Entregá path del MD.
```

## API

- `GET /api/engineering/backlog?format=agent&for=grok`
- `GET /api/engineering/backlog?format=agent&for=gemini`
- `GET /api/engineering/backlog?assignee=gemini`
