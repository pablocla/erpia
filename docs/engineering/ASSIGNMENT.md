# Asignación Grok Build vs Gemini

> Backlog en repo (no DB). UI: `/dashboard/engineering/backlog`  
> Colas: filtro **Grok** / **Gemini** · botones **Prompt Grok** / **Prompt Gemini**

## Criterio de ruteo

| Assignee | Quién | Hace | No hace |
|----------|-------|------|---------|
| **grok** | Grok Build (este entorno) | Código TS/TSX, APIs, Prisma, tests Vitest, runtime Leo/POS, fixes multi-archivo, security en código | Copy largo de marketing sin tocar código |
| **gemini** | Gemini (Chat/Cursor Gemini) | Docs MD, copy es-AR, one-pagers, playbooks, runbooks, matrices QA, auditorías de gaps, scripts de venta | Escribir `lib/` de producción sin review Grok |
| **pair** | Ambos en secuencia | Gemini escribe **spec/DoD/copy** → Grok **implementa** → Gemini o humano review | — |
| **human** | Vos / equipo | Precio, legal, elegir piloto, firmar UAT, ventas calle | Automatizable 100% |

### Reglas rápidas

1. Si el entregable principal es un **archivo de código ejecutable** → `grok`
2. Si el entregable principal es **Markdown / tabla / guión / matriz** → `gemini`
3. Si Gemini define y Grok codea → `pair` (Gemini va primero)
4. Si hay **decisión de negocio** → `human` (los agentes preparan opciones)

## Ciclo de vida del software (lifecycle)

```text
foundation → build → comercial → onboarding → implementacion → go_live → postventa → growth → scale
```

| Etapa | Ejemplos tickets | Owner típico |
|-------|------------------|--------------|
| foundation | AG-00, AUD-*, ENG-00 | grok (hecho) |
| build | ED-01…ED-04, SEC, tests | **grok** |
| comercial | COM-*, packaging, precio | **gemini** + **human** |
| onboarding | ED-09, ONB-*, trial copy | **pair** / gemini |
| implementacion | IMP-* runbooks CCA | **gemini** docs + **grok** hooks scrum |
| go_live | GL-*, HUM-02 piloto | **pair** + **human** |
| postventa | PV-*, recovery, QBR | **gemini** playbooks + **grok** health score |
| growth | GROW-*, FIS-01 | pair |
| scale | ED-19, INF, POS-01 SW | grok / pair |

## Cómo arrancar cada agente

### Grok Build

```text
Leé docs/engineering/ASSIGNMENT.md + PRODUCT_BACKLOG.md + backlog-status.json.
Implementá el primer ticket assignee=grok (o pair en fase code), P0/P1, W1, cascadeBlocked=false.
Al terminar: status done en backlog-status.json.
```

O en UI: **Prompt Grok**.

### Gemini

```text
Leé docs/engineering/ASSIGNMENT.md + GEMINI_QUEUE.md + PRODUCT_BACKLOG.md.
Ejecutá el primer ticket assignee=gemini abierto con su agentPrompt.
Entregable en docs/. No edites runtime lib/ salvo que el ticket diga pair y sea solo MD.
```

O en UI: **Prompt Gemini**.

API agent-ready:

- `GET /api/engineering/backlog?format=agent&for=grok`
- `GET /api/engineering/backlog?format=agent&for=gemini`

## Convivencia sin pelearse

| Riesgo | Mitigación |
|--------|------------|
| Gemini reescribe código Grok | Gemini solo `docs/**` en tickets gemini |
| Grok ignora specs | Tickets pair: leer MD de Gemini en paths del ticket |
| Dos agentes mismo archivo | Un solo `doing` por path; status JSON es semáforo |
| DB como tracker | **Prohibido** para este backlog |

## Orden de batalla sugerido (ambos en paralelo)

| Orden | Grok | Gemini (paralelo) |
|-------|------|-------------------|
| 1 | ED-01 fiado | DOC-01 lifecycle audit |
| 2 | ED-03 + ED-04 link MP | COM-01 one-pager Leo |
| 3 | ED-05 + ED-07 marketplace/anti-doble | COM-02 objeciones + COM-03 script demo |
| 4 | ED-12 security tests | ONB-01 emails trial |
| 5 | ED-08 KPI | IMP-01 runbook Cloud |
| 6 | ED-13 recovery $ | PV-01 playbook postventa |

Human en paralelo: **HUM-01** precio · **HUM-02** elegir piloto.
