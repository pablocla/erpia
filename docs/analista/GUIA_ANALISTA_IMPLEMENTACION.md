# Guía del analista técnico — Implementación, personalización y actualizaciones

> ERP Argentina | Para consultores, implementadores y soporte N2/N3  
> Comparación explícita con el modelo Protheus (TOTVS) y roadmap de madurez

---

## 1. Protheus vs ERP Argentina — modelo mental

| Dimensão | **Protheus (TOTVS)** | **ERP Argentina (este proyecto)** |
|----------|----------------------|-----------------------------------|
| **Lenguaje custom** | AdvPL — compilás fuentes → RPO en el AppServer del cliente | TypeScript — custom profundo = cambio en repo + deploy SaaS |
| **Diccionario de datos** | SIGACFG / metadatos en BD (campos, índices, triggers) sin tocar SQL a mano | Prisma + PostgreSQL: esquema en `schema.prisma` + migraciones SQL |
| **Campos nuevos “sin programar”** | Alta en diccionario → impacto en forms/informes estándar | `CampoPersonalizado` + `ValorCampoPersonalizado` (EAV por empresa) + UI en `/dashboard/campos-personalizados` |
| **Activar módulos / rutas** | Parámetros MV_* + configuración por grupo/filial | **Railroad engine**: `FeatureRubro` → `ConfiguracionRubro` → `FeatureEmpresa` (`isFeatureActiva`) |
| **Flujos de negocio** | Puntos de entrada AdvPL + workflows locales | `WorkflowRubro` + `WorkflowEngine` (pasos, transiciones, logs en BD) |
| **Catálogos propios del cliente** | Tablas SX* / cadastros | `TablaAuxiliar` + `ValorAuxiliar` |
| **Multi-empresa** | Filial (código + tabela compartilhada) | Multi-tenant: `empresaId` en todas las queries (`whereEmpresa`) |
| **Escala horizontal** | Vários AppServers + load balancer + TopConnect | Varias instancias Next.js stateless + PostgreSQL pool (Supabase/Railway) — **un deploy sirve N clientes** |
| **Escala vertical** | Más CPU/RAM en AppServer y DB | Más recursos en Postgres + instancia Node |
| **Actualización** | Patch UPDDIST / pacote compilado por versión | Hoy: `git pull` + `prisma migrate deploy` + `npm run build` — **manual, sin interfaz de parches** |
| **Personalización “estándar”** | Separación fuente custom vs estándar (merge en upgrade) | Separación por capas (ver §3); riesgo si se modifica core sin extension hooks |

**Conclusión:** Este ERP es **SaaS multi-tenant con parametrización en BD**, no un ERP “compilable en sitio” como Protheus. La escalabilidad horizontal es por **réplicas de la misma app**; la verticalización es por **rubro + features + workflows**, no por un binario AdvPL por cliente.

---

## 2. Las 5 capas de personalización (orden de preferencia)

El analista debe elegir la capa **más baja posible** que resuelva el requerimiento:

```
┌─────────────────────────────────────────────────────────────────┐
│ 5. CÓDIGO (TypeScript)     — PR, deploy, afecta todos o fork   │
├─────────────────────────────────────────────────────────────────┤
│ 4. WORKFLOW                — WorkflowRubro / pasos por proceso │
├─────────────────────────────────────────────────────────────────┤
│ 3. FEATURES + PARÁMETROS   — FeatureEmpresa, getFeatureParam   │
├─────────────────────────────────────────────────────────────────┤
│ 2. CAMPOS / CATÁLOGOS      — CampoPersonalizado, TablaAuxiliar  │
├─────────────────────────────────────────────────────────────────┤
│ 1. MAESTROS / CONFIG UI    — Plan cuentas, listas precio, IVA   │
└─────────────────────────────────────────────────────────────────┘
```

### Capa 1 — Configuración sin tocar BD estructural
- Plan de cuentas, numeradores, parámetros fiscales, listas de precio, usuarios/roles.
- **Dónde:** `/dashboard/configuracion`, onboarding por rubro.
- **Analista:** capacitación + datos maestros.

### Capa 2 — Equivalente parcial a SIGACFG (campos y tablas)
- **Campos personalizados:** `CampoPersonalizado` por `entidad` (cliente, producto, factura…).
- **Tablas auxiliares:** catálogos (“Origen lead”, “Tipo envío”).
- **API:** `/api/campos-personalizados`, `/api/config/tablas-auxiliares`.
- **Límite:** no crean joins automáticos en reportes complejos; hay que cablear en pantallas que lean `ValorCampoPersonalizado`.

### Capa 3 — Railroad / features (equivalente a “activar módulo MV”)
- Activar KDS, picking, agro, membresías por empresa.
- Parámetros JSON por feature (ej. días cobranza IA).
- **Código:** `lib/config/rubro-config-service.ts`, `configuracion-feature-service.ts`.
- **Doc técnica:** `docs/funcional/rubro-config-railroad-engine.md`.

### Capa 4 — Workflows
- Secuencias por rubro: venta → picking → remito → factura.
- **Código:** `lib/config/workflow-engine.ts` (colas de aprobación aún TODO BUG-004).

### Capa 5 — Desarrollo a medida
- Nueva pantalla, nueva regla fiscal, integración ML/ERP legado.
- Requiere PR, tests (`__tests__/`), revisión multi-tenant.

---

## 3. Árbol de decisión para el analista

```
¿El cliente pide un dato nuevo en un formulario existente?
  ├─ ¿Aparece en listados/reportes estándar? → Evaluar campo Prisma (capa 5) o CampoPersonalizado (capa 2)
  └─ Solo ficha / filtro → CampoPersonalizado (capa 2)

¿Pide ocultar o mostrar un módulo?
  └─ FeatureEmpresa / configuración rubro (capa 3)

¿Pide cambiar el orden de pasos (ej. obligar remito antes de factura)?
  └─ WorkflowRubro (capa 4) — validar con dev si el proceso ya está registrado

¿Pide lógica que no existe en ningún módulo?
  └─ Capa 5 + evaluar si conviene productizar como feature del rubro

¿Pide algo “como en Protheus” (fuente compilado en su servidor)?
  └─ Explicar modelo SaaS: no hay RPO por cliente; opciones son capas 1–4 o contrato custom (capa 5)
```

---

## 4. Roadmap de implementación por fase (analista)

| Fase | Actividades analista | Entregables | Herramientas ERP |
|------|---------------------|-------------|------------------|
| **0 Discovery** | Rubro, usuarios, roles, integraciones | Acta + matriz requerimientos | Onboarding IA, `funcional.txt` |
| **1 Param base** | Empresa, CUIT, PV AFIP, plan cuentas, depósitos | Empresa operativa homologación | `/dashboard/configuracion`, seed rubro |
| **2 Maestros** | Clientes, productos, proveedores, listas precio | Carga CSV / API | Import CSV, APIs maestros |
| **3 Custom ligero** | Campos extra, tablas aux, features on/off | Diccionario empresa documentado | Campos personalizados, features |
| **4 Procesos** | Flujos venta/compra/fiscal por rubro | Diagrama railroad | Workflow engine |
| **5 Integraciones** | MP, WhatsApp, ML, B2B portal | Credenciales en `.env` por tenant* | Rutas `/api/mercadopago`, etc. |
| **6 UAT + go-live** | Capacitación por rol, pendientes por rol | Checklist `TESTING_GEMINI.md` | Login redirect, `/api/pendientes` |
| **7 Hipercare** | Tickets, ajustes capa 1–3 | Log cambios (ver §6) | Soporte, auditoría |

\* En SaaS puro las credenciales viven en BD cifrada por `empresaId`, no en `.env` global — hoy mixto; documentar por cliente en implementación.

---

## 5. Actualizaciones — estado actual y modelo objetivo

### Hoy (manual — “modo Protheus sin UPDDIST”)

1. Mantenedor publica versión en Git (tag `vX.Y.Z`).
2. Por cada entorno (staging/prod):
   - `git pull` / deploy Vercel-Railway
   - `npx prisma migrate deploy`
   - `npm run build` + restart
3. **Todos los tenants** de ese entorno reciben el mismo código al mismo tiempo.
4. Personalizaciones capa 2–3 **persisten** en BD; capa 5 custom puede **romperse** si no hay tests.

**No existe aún:**
- Interfaz de parches tipo UPDDIST
- Actualización por tenant aislado
- Merge automático custom vs estándar

### Objetivo recomendado (roadmap producto)

| Modo | Cuándo | Mecanismo |
|------|--------|-----------|
| **SaaS rolling** | Clientes en cloud compartido | Deploy blue/green; migraciones backward-compatible; feature flags para activar cambios |
| **Tenant schema drift** | Solo campos EAV | Sin migración; ya soportado |
| **Parche SQL** | Cambio estructural BD | `prisma/migrations/*` versionado; nunca SQL ad hoc en prod |
| **Parche config** | Nuevas features por rubro | Seed idempotente `configuracion-feature-service` + script `apply` por empresa |
| **Hotfix cliente único** | Enterprise | Rama + deploy dedicado O override capa 3–4 (evitar capa 5) |
| **Panel actualizaciones** (futuro G14) | Operaciones | UI: versión actual, migraciones pendientes, changelog, ventana mantenimiento |

### Política sugerida de versiones

- **Patch (x.y.Z):** fixes, sin migración destructiva.
- **Minor (x.Y.0):** features, migraciones additive, seeds nuevos.
- **Major (X.0.0):** breaking API; ventana migración datos + comunicación analistas.

---

## 6. Historial y trazabilidad (lo que Protheus tiene en logs de compilación)

| Evento | Dónde debería quedar | Estado |
|--------|---------------------|--------|
| Alta campo personalizado | `CampoPersonalizado.createdAt` + auditoría | 🟡 parcial |
| Cambio feature empresa | `FeatureEmpresa` + invalidar cache | ✅ |
| Ejecución workflow | `WorkflowPasoLog` | ✅ |
| Cambio maestro crítico | `logActividad` / auditoría config | 🟡 ver `/dashboard/configuracion/auditoria` |
| Deploy versión | Changelog + tag Git | ❌ falta CHANGELOG.md |
| Custom capa 5 | PR + ticket + doc cliente | ❌ proceso manual |

**Recomendación G13-09:** por cada cliente enterprise, archivo `docs/clientes/<empresaId>/IMPLEMENTACION.md` con: rubro, features activas, campos custom, integraciones, contactos, fecha go-live.

---

## 7. FAQ — Analista de implementación

### ¿Puedo agregar un campo a Factura como en SIGACFG sin programador?
Sí, si la pantalla ya lee campos personalizados (capa 2). Si no, el analista levanta ticket capa 5 para cablear la UI.

### ¿La personalización de un cliente afecta a otros?
No, si usa `empresaId` (campos, features, workflows instancia). Sí, si se mergea código core sin feature flag.

### ¿Cómo escalo horizontalmente?
Más instancias de la app + Postgres con connection pooling; Redis para colas (pendiente). No hay “AppServer por cliente”.

### ¿Cómo escalo “verticalmente” por rubro?
Activar módulos del rubro (gastronomía vs agro vs industria) vía railroad; no requiere otro binario.

### ¿Actualizo un solo cliente?
En SaaS compartido: **no** (mismo deploy). Opciones: capa 2–3 por tenant, o instancia dedicada enterprise.

### ¿Qué pasa en un upgrade si el cliente tenía AdvPL custom?
Equivalente aquí: custom capa 5 puede requerir re-merge. Preferir capas 1–4 para upgrades painless.

### ¿Dónde está el diccionario?
- **Estructural:** `prisma/schema.prisma` (como diccionario SQL central).
- **Por empresa:** tablas `campos_personalizados`, `features_empresa`, `workflow_*`, `tablas_auxiliares`.

### ¿Hay interfaz de parche conectada?
**No hoy.** Actualización = deploy + `prisma migrate deploy`. Roadmap: panel G14 (§5).

---

## 8. Referencias en el repo

| Tema | Archivo |
|------|---------|
| Railroad / features | `docs/funcional/rubro-config-railroad-engine.md` |
| Campos personalizados | `prisma/schema.prisma` → `CampoPersonalizado` |
| Workflows | `lib/config/workflow-engine.ts` |
| Onboarding rubro | `lib/config/parametrizacion-rubro.ts` |
| Multi-tenant | `lib/auth/empresa-guard.ts`, `AGENTS.md` |
| Pendientes por rol | `funcional.txt`, `lib/pendientes/pendientes-service.ts` |
| Testing post-cambio | `TESTING_GEMINI.md` |
| Gaps doc/tech | `docs/G13_DOCUMENTACION_Y_TECNOLOGIA.md` |

---

## 9. Tareas documentales pendientes (G13-09 / G14)

- [ ] `CHANGELOG.md` por versión
- [ ] Plantilla `docs/clientes/_TEMPLATE_IMPLEMENTACION.md`
- [ ] `docs/actualizaciones/POLITICA_UPGRADE.md` (detalle operativo §5)
- [ ] Panel admin “versión y migraciones” (producto)
- [ ] FAQ ampliado por rubro (farmacia, agro, gastronomía)