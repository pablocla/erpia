# Prompt — Mejora producto retail calle (5 rubros)

> **Uso:** Copiá el bloque entre \`\`\` y pegalo en Cursor / Claude / Grok.  
> **Contexto:** Relevamiento de campo Claver Cloud — vendedor CEO en calle, fase monotributo.  
> **Fuentes:** `lib/ops/comercial-relevamiento-catalog.ts`, `docs/marketplace/14-pack-almacen-rosario.md`, `content/docs/funcional/sistema-pos.mdx`, `content/docs/funcional/rubros/otros-rubros.mdx`

---

## PROMPT (copiar desde acá)

```
Sos arquitecto de producto + tech lead de Claver ERP (Next.js 15, Prisma, PostgreSQL, AFIP, Zustand, shadcn).

CONTEXTO COMERCIAL
- Claver vende en calle a comercios de barrio en Argentina (Rosario y alrededores).
- Operador: CEO solo, monotributo, demo en testing@claver.com.ar, torre en Claver Cloud.
- Productos actuales con tracción:
  - Libreta Fiado (`pos.fiado_barrio`) ~$4.990/mes
  - Cobranzas WhatsApp (`intang.cobranzas_wa`) ~$20.000/mes
  - Pack Almacén Rosario (`pool-almacen-rosario`) ~$34.900/mes — 18 SKUs retail
- Relevamiento post-visita: 5 preguntas diagnóstico (fiado, cobranza, factura, stock, quién atiende).
- Dolores catálogo: fiado, cobranza, stock, factura, información.

GAPS POS CRÍTICOS YA DOCUMENTADOS (sistema-pos.mdx)
- P1: Sin escáner código de barras en POS
- P2: Sin impresora térmica/fiscal 80mm
- P3: Modo offline CAEA no plug-and-play
- P5: Búsqueda por codigoBarras en API productos
- P9: Sin PLU (botones acceso rápido)
- P10: Sin balanza integrada (serial/USB)

VOZ DEL CLIENTE POR RUBRO (lo que te dicen en la calle)

### 1. Almacenero / despensa
"No quiero un ERP. Me falta no perder plata con el fiado, saber qué reponer, y que el empleado cobre cuando no estoy."
- Fuerte: fiado, cobranza, lista distribuidora, margen, envases gaseosas.
- Débil hoy: onboarding masivo de productos; miedo a "sistema grande".
- Enganche comercial probado: Libreta Fiado → upsell pool-almacen.

### 2. Kiosquero
"Vendo rápido, escaneo, cierro caja. Sin tiempo para cargar ni aprender."
- Fuerte: vencimientos, rotación, SUBE/recargas, stock cero.
- Dealbreaker: sin pistola lectora / escáner no sirve.
- Falta: PLU top sellers, offline cuando se corta internet, cierre turno noche simple.

### 3. Ferretero / pinturería
"Miles de códigos, vendo por metro/litro, constructores con cuenta corriente, presupuesto de obra."
- Rechaza empaquetado "almacén de barrio".
- Fuerte: búsqueda por código, listas mayorista/mostrador, cuenta corriente obra.
- Falta: vendido por fracción, calculadora mezcla colores, presupuesto obra 15+ ítems.

### 4. Carnicero / fiambrería
"Vendo por kilo. La balanza manda. Fiado del barrio y precio del asado que cambia a la tarde."
- Dealbreaker: balanza integrada (peso → POS sin tipear).
- Fuerte después: fiado, factura, ticket 80mm.
- Falta: BOM media res → cortes, merma cárnica, etiqueta precio/kg.

### 5. Panadero
"No solo vendo: produzco. Me sobra pan, pedidos de sandwicherías a las 6 AM."
- POS solo no alcanza.
- Fuerte: fiado B2B restaurantes, merma/sobras fin de día.
- Falta: recetas/BOM panadería, pedidos anticipados AM, módulo producción simple.

MATRIZ DOLOR × RUBRO (prioridad relativa)
| Rubro      | Fiado | Cobranza | Stock | Factura | Producción/hardware |
|------------|-------|----------|-------|---------|---------------------|
| Almacén    | ★★★   | ★★★      | ★★    | ★★      | —                   |
| Kiosco     | ★     | ★        | ★★★   | ★       | Escáner ★★★         |
| Ferretería | ★★    | ★★       | ★★    | ★★★     | Fracción ★★★        |
| Carnicería | ★★    | ★★       | ★     | ★★      | Balanza ★★★         |
| Panadería  | ★★    | ★        | ★★★   | ★       | Producción ★★★      |

TAREAS — ENTREGÁ EN ESTE ORDEN

1. DIAGNÓSTICO HONESTO
   - Por cada rubro: qué puede vender Claver HOY sin mentir vs qué no cerrar todavía.
   - Tabla: rubro | enganche hoy | no prometer aún | objeción #1 | respuesta 30 seg.

2. ROADMAP PRIORIZADO (90 días, CEO solo)
   - Máximo 12 ítems ordenados por: impacto cierre calle × esfuerzo × dependencias.
   - Cada ítem: título, rubros beneficiados, archivos/módulos a tocar, estimación días, criterio "listo para vender".
   - Separar: quick wins (≤5 días), bloqueadores comerciales (escáner, balanza), packs nuevos (ferretería, panadería).

3. DISEÑO DE PACKS / SKUs
   - ¿Nuevo bundle `pool-kiosco-barrio`? ¿`pool-ferreteria`? ¿`pool-panaderia-produccion`?
   - Por pack: SKUs incluidos, precio sugerido ARS, speech de 1 línea, runbook activación.
   - Qué reutiliza de pool-almacen-rosario vs qué es net-new.

4. CAMBIOS EN RELEVAMIENTO CALLE
   - Agregar rubros faltantes: carniceria, panaderia, fiambreria.
   - Preguntas diagnóstico extra por rubro (máx 2 por rubro, no más de 7 total).
   - Regla automática: enganche sugerido según respuestas (ej. kiosco + "escaneo todo" → prioridad P1 escáner).

5. SPEECH Y OBJECIONES
   - 30 segundos por rubro (tono barrio, no corporativo).
   - 3 objeciones y contra-respuesta por rubro.
   - Cuándo ofrecer trial 14d vs cuándo decir "todavía no es para vos".

6. PLAN DE IMPLEMENTACIÓN TÉCNICO (top 5 ítems del roadmap)
   - Por ítem: schema Prisma si aplica, rutas API, componentes UI, tests Vitest mínimos.
   - Seguir convenciones: getAuthContext + whereEmpresa, lib/{modulo}/ services, dashboard pages.
   - No refactors cosméticos; solo lo que desbloquea venta calle.

FORMATO DE SALIDA
- Markdown con secciones numeradas 1–6.
- Tablas donde aplique.
- Al final: "Foco semana 1" (máx 3 tareas ejecutables por CEO solo).
- Al final: "Métricas de éxito" (ej. % visitas que aceptan trial por rubro, tiempo onboarding almacén).

RESTRICCIONES
- Locale es-AR, moneda ARS, IVA 21%, CUIT formato XX-XXXXXXXX-X.
- No inventar integraciones AFIP nuevas sin marcarlas como "fase 2".
- Ser explícito cuando un rubro requiere hardware (pistola, balanza, térmica).
- Priorizar lo que Pablo puede vender caminando solo, no equipo de 10 devs.

Empezá por el diagnóstico honesto y el roadmap 90 días.
```

---

## Variante corta (solo priorización)

```
Claver ERP — retail calle Argentina. Rubros: almacén, kiosco, ferretería, carnicería, panadería.

Gaps conocidos: sin escáner POS, sin térmica 80mm, sin balanza, sin fracción ferretería, sin pack panadería/producción.

Con producto actual (Libreta Fiado, Cobranzas WA, pool-almacen-rosario):
1) ¿Qué puedo vender HOY por rubro sin mentir?
2) Top 8 mejoras 90 días ordenadas por impacto en cierre calle.
3) Speech 30 seg + objeción #1 por rubro.
4) Foco semana 1 (3 tareas, CEO solo).

Output: tablas + roadmap numerado. es-AR.
```