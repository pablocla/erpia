# De piloto a producto vendible end-to-end

**Objetivo:** listar **todo lo que falta** para que Claver deje de operar como “piloto / demo comercial” y sea un **producto vendible en todo sentido**: marketing → venta → cobro → implementación → go-live → soporte → renovación/expansión.

**No es solo código.** Incluye comercial, legal, ops, partners, producto, calidad y postventa.

| Documento hermano | Rol |
|-------------------|-----|
| [`GO_LIVE_PRD.md`](./GO_LIVE_PRD.md) | Qué packs se pueden poner en PRD *hoy* |
| [`qa/FALTANTES_TECNICOS_NICHOS.md`](./qa/FALTANTES_TECNICOS_NICHOS.md) | Gaps técnicos por rubro |
| [`deploy/VERCEL_ENV.md`](./deploy/VERCEL_ENV.md) | Env producción |
| [`qa/partner-billing-monetizacion.md`](./qa/partner-billing-monetizacion.md) | MP + partners |
| [`operaciones/CLAVER_CLOUD_PROCESO_IMPLEMENTACION.md`](./operaciones/CLAVER_CLOUD_PROCESO_IMPLEMENTACION.md) | Proceso Cloud |

**Última actualización:** 2026-07-18

---

## 0. Definición de “producto vendible en todo sentido”

Un SaaS B2B está **vendible de punta a punta** cuando se cumplen **las 8 cadenas** a la vez:

| # | Cadena | Pregunta |
|---|--------|----------|
| 1 | **Oferta clara** | ¿El cliente sabe qué compra, por cuánto, y qué no incluye? |
| 2 | **Demostración confiable** | ¿La demo no miente y el trial no se cae? |
| 3 | **Cierre y cobro** | ¿Puede pagar solo (MP) y el sistema activa solo? |
| 4 | **Contrato y cumplimiento** | ¿Hay términos, privacidad, facturación legal de Claver? |
| 5 | **Implementación repetible** | ¿Cualquier analista/partner onboardea en N días con checklist? |
| 6 | **Go-live estable** | ¿Opera 30 días sin P0 y sin Excel paralelo? |
| 7 | **Soporte postventa** | ¿Hay canal, SLA, escalamiento, base de conocimiento? |
| 8 | **Retención y expansión** | ¿Dunning, upsell, health score, partner comisionado? |

Hoy Claver tiene **piezas fuertes en 2–3–6 (parcial)** y **huecos serios en 1, 4, 5, 7, 8** según pack.  
Este documento lista faltantes **por cadena**, no solo por módulo.

**Estados usados abajo**

| Estado | Significado |
|--------|-------------|
| **FALTA** | No existe o es informal |
| **PARCIAL** | Hay código/doc pero no cierra el loop comercial |
| **OK (con caveats)** | Sirve si se cumplen condiciones |
| **BLOQUEA VENTA** | Mientras no esté, no se debe escalar comercialmente ese tramo |

---

## 1. Oferta comercial (qué se vende)

### 1.1 Catálogo y packaging

| Faltante | Estado | Por qué importa | Qué construir / decidir |
|----------|--------|-----------------|-------------------------|
| **Una sola lista “vendible PRD” en código + comercial** | PARCIAL | `GO_LIVE_PRD` y `PACKS_CALLE.vendibleHoy` no están 100% sincronizados; landings prometen más | Flag `goLiveTier: prd \| piloto \| demo` en registry + UI marketplace |
| **SKU ↔ precio ↔ promesa en una ficha** | PARCIAL | Precios en enganches, bundles, ofertas y landings divergen | Ficha comercial por SKU: precio, trial, ancla, incluye/excluye, SLA |
| **Planes publicables (Starter / Growth / Business)** | FALTA / PARCIAL | Venta B2B necesita escalones claros, no 40+ SKUs sueltos | 3–4 planes + add-ons; el resto “bajo pedido” |
| **Add-ons con precio de lista y de partner** | PARCIAL | Partner no sabe margen | Lista partner con % comisión y precio calle |
| **Qué incluye setup ($50k impl) vs self-serve** | PARCIAL | Setup fee existe en ofertas; proceso de venta no siempre lo cobra | SKU setup obligatorio en packs con AFIP/hardware |
| **Matriz “demo sí / PRD no” en material de venta** | PARCIAL | Vendedor vende el catálogo de demos | One-pager §3 de GO_LIVE_PRD impreso/CRM |
| **Nombre de producto unificado (Claver / Claverp / ClavERP)** | PARCIAL | Confunde marca en docs y landings | Glosario de marca oficial y rename gradual |

### 1.2 Pricing y política comercial

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Precio de lista único por SKU en prod** | PARCIAL | `precioCobrableSku` + piso $10.000; falta lista comercial publicada y versionada |
| **Política de descuentos (quién puede bajar precio)** | FALTA | Sin floor por rol → partners regalan margen |
| **Prorrateo mid-cycle y upgrade/downgrade** | PARCIAL | Upgrade existe; downgrade/crédito de meses no es producto cerrado |
| **Multi-sucursal / multi-caja pricing** | FALTA | Cómo se cobra 2do local, 2do punto de venta AFIP |
| **Ancla gratis (fiado) + upsell path medido** | PARCIAL | Funnel existe; falta playbook “día 7 / día 14” con % conversión objetivo |
| **Factura de Claver al cliente (tu AFIP como SaaS)** | FALTA/PARCIAL | Cobro MP ≠ factura A/B al tenant; contabilidad de Claver |
| **Impuestos del SaaS (IVA sobre suscripción)** | FALTA en producto | Definir si precio es +IVA, responsabilidad fiscal documentada |

### 1.3 Contratos y legal (bloquea escala)

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Términos y condiciones SaaS aceptados en registro** | PARCIAL | Checkbox / versión de ToS, repositorio de versiones |
| **Política de privacidad + DPA** | PARCIAL | Especialmente HC (vet/clínica) y datos de empleados |
| **Acuerdo de nivel de servicio (SLA) publicado** | FALTA | Uptime, RTO/RPO, créditos por downtime |
| **Contrato de implementación / SOW por pack** | FALTA | Alcance, horas, exclusiones, firma |
| **Contrato partner / NDA / comisión** | PARCIAL | Programa existe; falta contrato estándar firmable |
| **Retención y baja de datos (offboarding)** | FALTA | Export + borrado a pedido + plazos |
| **Límites de uso (API, IA tokens, storage)** | PARCIAL | Meter IA existe; política comercial de overage no |
| **Aviso de módulos “piloto” en contrato** | FALTA | Anexo: features en beta sin SLA |

---

## 2. Adquisición y marketing

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Mensaje por pack (no “ERP de 40 módulos”)** | PARCIAL | Landings por rubro; unificar con GO_LIVE_PRD |
| **SEO / ads solo a packs PRD** | FALTA proceso | No gastar en fumigación/AC hasta OT Field |
| **Casos de éxito reales (logo + número)** | FALTA | 3 casos con métrica (fiado cobrado, tiempo de cierre) |
| **Comparativa vs Excel / competencia local** | FALTA | Battle cards para vendedor |
| **Lead scoring y CRM del embudo** | PARCIAL | Pipeline comercial existe; scoring demo→trial→paid incompleto |
| **UTM + atribución partner en todo el funnel** | PARCIAL | `?ref=` en registro; falta en demos y landings de producto |
| **Contenido post-demo (“cómo seguir”)** | PARCIAL | Email automático post-demo con CTA registro |
| **Política de demos públicas vs rate limit** | PARCIAL | Rate limit 15/15min; falta demos pre-warmed o shared |

---

## 3. Demo y trial (entrada al producto)

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Demo = promesa verdadera** | PARCIAL | Seeds mejorados (vet/taller/club/gym); aún hay rubros vacíos |
| **Timeouts Vercel Hobby en demos** | BLOQUEA a escala | Pro o demos pre-provisionadas |
| **Trial con datos del cliente (no solo seed)** | PARCIAL | Onboarding IA / retail; wizard “primer día” incompleto por pack |
| **Activar pack desde landing (`?activar=`)** | OK/PARCIAL | Funciona; medir conversión |
| **Prohibir vender demo como “ya está en prod”** | FALTA proceso | Script comercial + CRM stages |
| **Health check automático post-demo** | PARCIAL | `demo-health` analista; no bloquea marketing |
| **Empty states con CTA** cuando no hay seed | PARCIAL | Evitar pantalla muerta en nichos sin datos |

---

## 4. Cierre de venta y cobro (Claver cobra)

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Checkout MP producción 100%** | PARCIAL | Código listo; depende de env Vercel y webhook |
| **Prohibir mock en Production** | PARCIAL | Policy en código; auditoría de env |
| **Presupuesto comercial → link de pago** | FALTA | Flujo vendedor genera preferencia con SKU y partner |
| **Orden de compra / factura proforma** | FALTA | Empresas que no pagan con MP de una |
| **Pago anual con descuento** | FALTA | Producto y MP preapproval anual |
| **Fallos de cobro y reintento (dunning SaaS)** | PARCIAL | Trial dunning; dunning de suscripción vencida a mejorar |
| **Portal “Mi plan” claro (qué pago, cuándo, cancelar)** | PARCIAL | Existe página; UX de cancelación/upgrade a cerrar |
| **Reembolsos y chargebacks** | FALTA | Proceso ops + estado de SKUs |
| **Comisión partner automática al paid** | OK/PARCIAL | Se registra; liquidación cash manual |
| **Comisión por setup implementador** | PARCIAL | Copy de programa; no 100% en ledger |

---

## 5. Implementación (de “firmó” a “usa”)

### 5.1 Proceso

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Playbook por pack PRD (hora a hora)** | PARCIAL | Cloud implementation; falta playbook estándar 4h/1d/3d |
| **Proyecto de implementación automático al cerrar** | PARCIAL | A veces se crea; no siempre ligado a pago |
| **Dueño del ticket de onboarding (analista asignado)** | PARCIAL | Asignaciones Cloud; capacidad y cola |
| **Importación de datos (CSV clientes/productos)** | PARCIAL | CSV import existe; plantillas por pack + validación |
| **Migración desde Excel/otro POS** | FALTA | Servicio de migración empaquetado |
| **Capacitación por rol (video + checklist)** | PARCIAL | Docs/wiki; falta LMS corto por pack |
| **Ambiente de práctica (sandbox del cliente)** | FALTA | Separar demo efímera de sandbox 7 días con sus datos |
| **Criterio de “implementación completa” medible** | FALTA | Definition of Done: N ventas, 1 cierre caja, 1 usuario cajero |

### 5.2 Técnica go-live (cliente)

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Checklist §6 de GO_LIVE_PRD firmado** | PARCIAL | Existe en doc; no hay UI “cerrar implementación” en Cloud |
| **AFIP self-serve o guiado** | PARCIAL | Wizard homologación; prod casi siempre con humano |
| **Hardware POS (impresora, lectora)** | PARCIAL | Pack hardware + checklist; logística física fuera del software |
| **Conectividad y offline** | PARCIAL | Offline existe; no garantizado PRD |
| **Multi-usuario y permisos por rol** | OK/PARCIAL | Roles hay; perfiles “solo cajero fiado” a pulir |
| **Backup / export del cliente** | PARCIAL | Export reportes; export full tenant a pedido |

### 5.3 Partners implementadores

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Certificación partner (nivel 1 / 2)** | FALTA | Curso + examen + badge |
| **Portal de leads asignados** | PARCIAL | Partner portal; asignación de leads comerciales |
| **Herramientas de impersonación auditada** | PARCIAL | Ops; logs de quién impersonó y por qué |
| **Comisión de implementación vs recurrente** | PARCIAL | Definir split y cargarlo al cerrar SOW |

---

## 6. Go-live y estabilidad (producto en producción)

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Observabilidad por tenant** | PARCIAL | Logs sistema; falta dashboard “errores 5xx por empresa” |
| **Alertas P0 a on-call** | FALTA | Pager/Slack si fiado o cobro cae |
| **Status page pública** | FALTA | status.claver… |
| **Error budgets / release train** | FALTA | No deploy sin smoke packs PRD |
| **Smoke e2e en CI contra staging** | PARCIAL | Playwright e2e hay; no gate de release completo |
| **Feature flags por pack en prod** | PARCIAL | Features por empresa; kill-switch global |
| **Límites de rate y abuso** | PARCIAL | Rate limit demos; abuso multi-tenant a endurecer |
| **DR: backup DB y restore testado** | FALTA proceso | Supabase backups; drill trimestral documentado |
| **Performance budgets (POS &lt; X ms)** | FALTA | SLA de latencia en mostrador |
| **Seguridad: pentest / dependency audit** | FALTA/PARCIAL | Multi-tenant HC mejorado; programa de seguridad formal |
| **Compliance fiscal del software** | PARCIAL | AFIP por tenant; certificación del producto como software de gestión |

---

## 7. Soporte postventa

### 7.1 Canales y operación

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Canal único de soporte (ticket)** | PARCIAL | Módulo tickets/soporte en app; no todos los clientes lo usan |
| **Horario y SLA por plan** | FALTA | Starter 48h / Growth 24h / Business 4h |
| **Cola priorizada (pago &gt; trial &gt; demo)** | FALTA | En Cloud / tickets |
| **Base de conocimiento por pack** | PARCIAL | Docs MDX / capacitación; falta “cómo cobro un fiado” en 5 pasos por rol |
| **Macros / respuestas estándar** | FALTA | Para partners y L1 |
| **Escalamiento L1 → L2 → ingeniería** | FALTA | Severidades, tiempos, dueño |
| **CSAT post-ticket** | FALTA | 1-click “¿resolvimos?” |
| **Chat in-app contextual** | PARCIAL | Chat widget / ayuda contextual; no unificado con tickets |
| **Teléfono / WhatsApp soporte Claver** | PARCIAL | Comercial sí; soporte con horario y número oficial |
| **Idioma y tono (es-AR)** | OK | Mantener |

### 7.2 Éxito del cliente (CS)

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Health score por tenant** | FALTA | Login 7d, ventas, fiados, SKUs usados |
| **Alertas “cliente en riesgo”** | FALTA | 0 logins 7d → task CS |
| **QBR / revisión 30-60-90** | FALTA | Plantilla y dueño |
| **Onboarding checklist en la app del cliente** | PARCIAL | Tours/checklists; no “% listo para go-live” visible |
| **Educación continua (novedades del pack)** | FALTA | Changelog segmentado por SKU |
| **Comunidad / grupo de usuarios** | FALTA | Opcional; reduce tickets |

### 7.3 Incidentes y bugs

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Severidad P0–P3 con tiempos** | FALTA | Definición + reloj |
| **Hotfix process** | FALTA | Quién aprueba deploy de emergencia |
| **Comunicación de incidente al tenant** | FALTA | Banner in-app + mail |
| **Postmortem público interno** | FALTA | Template 5 whys |
| **Report-error button → ticket con contexto** | PARCIAL | Botón report error; enriquecer con tenant/SKU/ruta |

---

## 8. Renovación, expansión y churn

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Dunning de suscripción (falló el MP)** | PARCIAL | Reintentos + mails + gracia + bloqueo soft |
| **Cancelación self-serve con encuesta** | PARCIAL | Motivo de baja estructurado |
| **Win-back (30/60 días post-baja)** | FALTA | Campaña + oferta |
| **Upsell in-app medido** | PARCIAL | Upsell panel; embudo y % |
| **Cross-sell por rubro (fiado → POS → reportes)** | PARCIAL | Ofertas; playbooks CS |
| **Expansión multi-sucursal / multi-empresa** | PARCIAL | Contador multi-empresa; pricing de 2da sucursal |
| **NPS / CSAT periódico** | FALTA | Encuesta in-app trimestral |
| **MRR / churn dashboard en Cloud** | PARCIAL | Billing Cloud; métricas SaaS estándar (NRR, logo churn) |
| **Forecast de renovaciones** | FALTA | 30 días antes de vigencia |

---

## 9. Partners y canal

| Faltante | Estado | Qué falta |
|----------|--------|-----------|
| **Portal partner usable en PRD** | OK/PARCIAL | Link, comisiones, crédito; cash manual |
| **Liquidación cash con CBU y comprobante** | PARCIAL | Panel Cloud; falta export bancario + conciliación |
| **Payout automático (opcional fase 2)** | FALTA | No bloquea venta si el crédito Claver es default |
| **Material de venta para partner (PDF/kit)** | FALTA | Deck + one-pagers + videos |
| **Reglas anti-conflicto de leads** | FALTA | Mismo CUIT no se comisiona dos veces |
| **Partner de hardware (impresoras)** | PARCIAL | Bundle; red de instaladores |
| **Partner contador (estudio)** | PARCIAL | Pack contador gratis con 3 pagos; playbook estudio |

---

## 10. Producto: de “piloto técnico” a “cerrado comercialmente”

Agrupado por impacto en **vendibilidad** (no exhaustivo de nichos; ver FALTANTES).

### 10.1 Debe estar cerrado para escalar venta calle (P0 comercial)

| Ítem | Estado | Nota |
|------|--------|------|
| Fiado estable (APIs + provision) | PARCIAL | Ancla de adquisición |
| Cobro MP real + webhook en prod | PARCIAL | Sin esto no hay SaaS |
| Registro → trial → home correcta | OK/PARCIAL | Golden path post-login |
| Empty states / no pantallas muertas en packs PRD | PARCIAL | |
| Multi-tenant isolation (todos los módulos PRD) | PARCIAL | HC mejorado; auditar resto |
| “Mi plan” y trial vencido claros | PARCIAL | |
| Documentación de “día 1” por pack PRD | FALTA | |

### 10.2 Debe estar para dejar de ser “solo piloto” en nichos que ya se demuestran

| Ítem | Estado |
|------|--------|
| OT Field reutilizable (taller → oficios) | FALTA |
| Contratos de mantenimiento + rutas | FALTA |
| Ferretería unidades/presupuestos obra | PARCIAL |
| Gym: home única + cobro de cuota simple | PARCIAL |
| Vet: ficha+consulta+cobro en un flujo | PARCIAL |
| Import CSV validado clientes/productos | PARCIAL |

### 10.3 No priorizar para “vendible general” (distracción)

| Ítem | Por qué postergar |
|------|-------------------|
| 20 verticales nuevos sin motor | Diluye |
| Telemedicina / HIS hospitalario | Otro producto |
| Telemetría surtidores / IoT industrial calle | Otro GTM |
| Payout partner automático día 1 | Crédito Claver alcanza al inicio |

---

## 11. Organización y métricas (sin esto no hay producto comercial)

### 11.1 Roles mínimos

| Rol | Faltante típico hoy |
|-----|---------------------|
| Product owner de packs PRD | Dueño de fiado/POS vs nichos |
| Comercial con cuota y CRM | Disciplina de stages |
| Implementador / analista Cloud | Capacidad finita |
| Soporte L1 | SLA y macros |
| Ingeniería on-call | Rotación y alertas |
| Finance SaaS | Facturación Claver, conciliación MP |

### 11.2 KPIs que faltan formalizar

| KPI | Target ejemplo (a definir) |
|-----|----------------------------|
| Demo → registro | ≥ X% |
| Registro → activación (1 acción golden path) | ≥ Y% en 48h |
| Trial → paid | ≥ Z% |
| Time-to-go-live | ≤ 5 días hábiles packs PRD |
| Tickets P0 | MTTR &lt; 4h |
| Logo churn mensual | &lt; A% |
| NRR | &gt; 100% |
| NPS | &gt; B |
| % tenants con health score verde | ≥ C% |

Sin dashboard de estos KPIs en Cloud, el negocio opera a ciegas (sigue siendo “piloto de empresa”).

---

## 12. Roadmap por oleadas (para dejar de ser piloto)

### Oleada 0 — “Podemos cobrar y no mentir” (2–4 semanas)

1. MP prod + webhook + `go-live/status` verde en producción  
2. ToS/privacidad aceptados en registro  
3. Script comercial = solo packs §3.1 GO_LIVE_PRD  
4. Smoke fiado + POS en staging con gate de release  
5. Canal soporte + horario publicado  
6. Checklist go-live en Cloud (checkbox por tenant)

**Criterio de salida:** 5 clientes en PRD packs §3.1 con cobro real.

#### Oleada 0 — implementado en código (2026-07-18)

| Ítem | Dónde |
|------|--------|
| Catálogo packs PRD/piloto en código | `lib/comercial/go-live-packs.ts` |
| Checklist comercial por tenant | `lib/ops/commercial-go-live-checklist.ts` |
| API + UI Cloud | `GET/POST /api/claver/go-live` · `/claver-cloud/go-live` |
| ToS + privacidad en registro | checkbox + `/legal/terminos` · `/legal/privacidad` · persist `tos_accepted` |
| Mock MP bloqueado en production | `createMercadoPagoSubscription` + marketplace policy |
| Salud plataforma | `GET /api/go-live/status` (existente) |

**Sigue manual / ops:** configurar env Vercel real, SLA soporte publicado, smoke e2e gate en CI, 5 clientes reales.

### Oleada 1 — “Implementación y soporte repetibles” (4–8 semanas)

1. Playbooks 1 día por pack PRD + plantillas CSV  
2. SLA por plan + severidades  
3. Health score + alerta inactividad  
4. Dunning suscripción + “Mi plan” cancelación  
5. Kit partner + liquidación cash con export  
6. Casos de éxito 3×  

**Criterio de salida:** time-to-go-live medido; CSAT soporte &gt; meta.

### Oleada 2 — “Producto que se expande solo” (8–16 semanas)

1. OT Field + 2 skins (taller + un field service)  
2. Inbox WA pedidos  
3. Upsell automatizado fiado → POS → reportes  
4. Multi-sucursal pricing  
5. Status page + on-call  

**Criterio de salida:** NRR &gt; 100%; se vende OT Field sin “piloto especial”.

### Oleada 3 — “Escala” 

1. Certificación partners  
2. Migraciones asistidas  
3. Planes anuales  
4. Expansión vertical solo sobre motores  
5. Pentest / compliance  

---

## 13. Matriz RACI (quién mueve cada cadena)

| Cadena | Producto | Comercial | Analista/Impl | Soporte | Ingeniería | Finance |
|--------|----------|-----------|---------------|---------|------------|---------|
| Oferta / pricing | A | R | C | I | C | C |
| Demo / trial | A | R | C | I | R (seeds) | I |
| Cobro MP | A | C | C | I | R | A |
| Legal / ToS | A | C | I | I | C | C |
| Implementación | C | C | R | C | C | I |
| Go-live técnico | C | I | R | C | A | I |
| Soporte L1 | C | I | C | R | C | I |
| CS / retención | A | C | C | R | I | C |
| Partners | A | R | C | I | C | R (pagos) |

R = responsible, A = accountable, C = consulted, I = informed.

---

## 14. Definition of Done: “ya no somos un piloto”

Claver es **producto vendible end-to-end** cuando:

- [ ] Solo se publicita y se cierra lo de **GO_LIVE_PRD §3.1** (o actualizado)  
- [ ] Todo cliente pago tiene **ToS aceptados + factura/comprobante de cobro**  
- [ ] **MP prod** sin mock; webhook OK; dunning básico  
- [ ] Implementación &lt; **N días** con checklist en Cloud  
- [ ] Soporte con **SLA** y ticket; P0 con dueño  
- [ ] Health score y churn visibles en Cloud  
- [ ] Partner cobra comisión (crédito o cash liquidado en &lt; X días)  
- [ ] 10+ tenants en packs PRD **&gt; 30 días** sin Excel paralelo  
- [ ] NPS o CSAT medido al menos una vez  
- [ ] Release gate: smoke packs PRD en verde  

Hasta que no se tilden, el modelo correcto es:

> **“Vendemos packs PRD con implementación; el resto es piloto o demo.”**

---

## 15. Prioridad única (top 15 para dejar de ser piloto)

Orden sugerido para el negocio (no solo código):

| # | Faltante | Tipo | Impacto |
|---|----------|------|---------|
| 1 | MP + webhook + env prod auditados | Cobro | BLOQUEA |
| 2 | Oferta comercial única (planes + ficha SKU) | Comercial | BLOQUEA escala |
| 3 | ToS / privacidad en registro | Legal | BLOQUEA escala |
| 4 | Fiado 100% estable en prod | Producto | Adquisición |
| 5 | Script + CRM: solo packs PRD | Comercial | Evita overpromise |
| 6 | Checklist go-live en Cloud | Impl | Repetibilidad |
| 7 | Soporte L1 + SLA + canal | Postventa | Retención |
| 8 | Dunning + Mi plan claro | Cobro/CS | Cash |
| 9 | Health score + alerta inactividad | CS | Churn |
| 10 | Playbooks impl 1 día + CSV | Impl | Time-to-value |
| 11 | Smoke e2e gate en release | Calidad | Confiabilidad |
| 12 | Kit y liquidación partner | Canal | Escala ventas |
| 13 | Casos de éxito + battle cards | Marketing | Conversión |
| 14 | OT Field (motor) | Producto | Nuevos verticales vendibles |
| 15 | Status page + on-call | Ops | Seriedad B2B |

---

## 16. Resumen ejecutivo

| Dimensión | Hoy | Para ser “vendible en todo sentido” |
|-----------|-----|-------------------------------------|
| Producto core | Fuerte | Cerrar fiado + cobro + empty states PRD |
| Nichos | Demo/piloto | Solo PRD los de GO_LIVE; resto con SOW de piloto |
| Cobro | Código listo | Env prod + dunning + sin mock |
| Comercial | Muchas promesas | Catálogo corto, precios, ToS |
| Impl | Manual / héroe | Playbook + checklist Cloud |
| Soporte | Parcial | SLA + tickets + CS |
| Partners | Billetera sí | Kit + liquidación predecible |
| Ops | Parcial | Observabilidad + release gates |

**Conclusión:**  
No alcanza con “que la demo se vea bien”.  
Hace falta **cerrar el sistema operativo comercial** (oferta → cobro → impl → soporte → renovación) y **restringir la promesa** a lo que el producto ya puede sostener en PRD, mientras se construyen motores (OT Field, etc.) para ampliar catálogo sin volver al modo piloto eterno.

---

*Documento de dirección: alinear producto, comercial, partners y soporte. Actualizar cuando un ítem de la §14 o §15 pase a OK.*
