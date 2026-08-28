# Cola Gemini — tickets assignee=gemini | pair (fase docs)

> **Restante cara gratis (1 archivo, no reabrir MAX_PCT):** [`PROMPT_GEMINI_RESTANTE.md`](./PROMPT_GEMINI_RESTANTE.md) — vitrine, `/f` paridad, reportes UI 402.  
> **Subir % (ola anterior, ya corrida):** [`PROMPT_GEMINI_MAX_PCT.md`](./PROMPT_GEMINI_MAX_PCT.md)  
> **Prompt único para cerrar el core (recomendado):** [`PROMPT_GEMINI_CERRAR_TODO.md`](./PROMPT_GEMINI_CERRAR_TODO.md) — empleados = extra, no el norte.  
> **Prompt para tramitar TODO lo free (ancla $0 + item shop + calle):** [`PROMPT_GEMINI_FREE.md`](./PROMPT_GEMINI_FREE.md) — manda en posicionamiento comercial si los dos corren.  
> Generado para pegar en Gemini. Estados vivos: `backlog-status.json`.  
> Criterio: `ASSIGNMENT.md`.

## Prompt de sesión (copiar)

```text
Sos Gemini en el monorepo Claver. Solo docs/ y Markdown.
Leé docs/engineering/ASSIGNMENT.md y este archivo.
Ejecutá el primer ticket TODO de la lista P0/P1 abajo.
Guardá el entregable en el path indicado. Al final listá el archivo creado.
```

## P0 / P1 — empezar acá

| ID | Pri | Life | Title | Entregable sugerido | agentPrompt (resumen) |
|----|-----|------|-------|---------------------|------------------------|
| **DOC-01** | P0 | comercial | Auditoría gaps ciclo vida | `docs/engineering/LIFECYCLE_AUDIT.md` | Tabla etapa × existe × gap × owner |
| **COM-01** | P0 | comercial | One-pager Leo | `docs/comercial/LEO_ONE_PAGER.md` | Headline + dolor + CTA trial |
| **DOC-03** | P1 | foundation | Mantener esta cola | este archivo | Refrescar si cambia catálogo |
| **COM-02** | P1 | comercial | Matriz objeciones | `docs/comercial/OBJECIONES_VENTA.md` | ≥12 objeciones |
| **COM-03** | P1 | comercial | Script demo 15 min | `docs/comercial/SCRIPT_DEMO_15.md` | Guión timed calle |
| **COM-04** | P1 | comercial | Packaging packs vs Leo | `docs/comercial/PACKAGING_LEO.md` | Tabla SKU (tras ED-22) |
| **ONB-01** | P1 | onboarding | Emails trial D0–D7 | `docs/comercial/TRIAL_SEQUENCE_LEO.md` | 4 mensajes |
| **IMP-01** | P1 | implementacion | Runbook Cloud Leo | `docs/claver-cloud/runbooks/leo-cobranzas.md` | CCA pasos |
| **IMP-03** | P1 | implementacion | Checklist UAT | `docs/claver-cloud/UAT_CHECKLIST.md` | 15 PASS/FAIL |
| **PV-01** | P1 | postventa | Playbook postventa | `docs/marketplace/POSTVENTA_LEO.md` | Cadencias success |
| **QA-01** | P1 | build | Matriz QA Leo | `docs/qa/QA_LEO_MATRIX.md` | ≥15 casos para Grok tests |
| **GL-02** | P2 | go_live | Playbook D0 prod | `docs/deploy/GO_LIVE_D0.md` | Primeras 24h |
| **PV-03** | P2 | postventa | Macros soporte L1 | `docs/soporte/MACROS_L1.md` | Árbol decisión |
| **DOC-02** | P2 | onboarding | Manual usuario Leo | `docs/funcional/LEO_MANUAL_USUARIO.md` | Sin jerga |

## Pair (vos escribís spec primero)

| ID | Title | Tu parte (Gemini) | Luego Grok |
|----|-------|-------------------|------------|
| ED-06 | Branding cobranzas→Leo | Copy nombres/descripciones | Aplicar en catalog |
| ED-09 | Onboarding 3 pasos | Microcopy wizard | UI wizard |
| ED-22 | Precio canónico | One-pager precios (con HUM-01) | precioArs en código |
| MKT-01 | Solapa Empleados | Textos cards | apps-page-tabs |
| COM-05 | Pipeline handoff | Doc estados | Gaps API |
| GL-01 | Matriz go-live env | Tabla env×pack | Checks /api/go-live |
| ONB-02 | Checklist activación | Lista pasos | UI checklist |
| PV-04 | QBR mensual | Template informe | Export/datos |
| ED-25/26 | Sofía / Ramiro | Spec tools+tono | Templates código |
| GROW-01 | Demo landing | Copy bloque | Endpoint rate-limit |

## No tocar (Grok only)

ED-01…ED-05, ED-07, ED-08, ED-10…ED-16, SEC-*, TOK-01, IMP-02, PV-02, runtime `lib/empleados-digitales/**` implementación.

## Human (solo vos)

- **HUM-01** Precio final  
- **HUM-02** Elegir 1–3 pilotos reales  
