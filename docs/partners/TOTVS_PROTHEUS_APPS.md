# Claver × TOTVS Protheus — Apps de partner, integración y valor

> **Audiencia:** compañero TOTVS (canal / implementación) + Claver Soft.  
> **Fecha:** 2026-09-17  
> **Estado:** brief técnico para alianza. No es contrato ni lista de precios TOTVS.  
> **Regla comercial:** Claver **no reemplaza** Protheus. Claver es la capa de experiencia (móvil, WhatsApp, AFIP AR, POS, cotizaciones en vivo) que se enchufa al backoffice. Protheus sigue siendo el system of record.

---

## 1. Tesis en una página

Protheus (SIGAFIN / SIGAFAT / SIGAEST / SIGACTB) es fuerte en maestros, títulos, stock y contabilidad. Es débil —sobre todo en Argentina— en:

| Hueco típico del cliente Protheus | Qué pone Claver encima |
|-----------------------------------|------------------------|
| UI de escritorio / AdvPL para el operador de piso | Apps web/móvil modernas |
| Tesorería operativa (FINA716) sin mark-to-market en vivo | **Claver Inversiones** (cuña del piloto) |
| Fiscal Brasil (NFe/SPED); AFIP/IVA/IIBB AR a medida | Facturación electrónica AR + OCR |
| Cobranzas por teléfono / Excel | WhatsApp + links de pago |
| POS / KDS / vendedor en ruta | Front operativo que inyecta al ERP |
| Portal B2B del cliente final | Self-service sobre SA1/SC5/SF2/SE1 |

**Modelo de alianza:** Claver entra como **Parceiro de Solução** (ideal) o, en el primer deal, como **Solução com integração homologada / Recommended Partner**. El canal TOTVS vende y comisiona; Claver cobra SaaS; el implementador TOTVS factura horas de ADVPL + parametrización.

Código ya existente en este repo (no hay que inventar el puente):

| Pieza | Path |
|-------|------|
| Legacy Bridge (adapters) | `lib/legacy-bridge/` |
| Contratos REST por app | `lib/legacy-bridge/api-contracts.ts` |
| Boletines técnicos (tablas, MV, PRW) | `lib/legacy-bridge/technical-bulletins.ts` |
| Fuentes AdvPL | `data/protheus/advpl/edge/` |
| Entidades canónicas OPO | `lib/opo/types.ts` |
| Catálogo SKU Claver | `lib/marketplace/marketplace-catalog.ts` |

---

## 2. Cómo se integra (arquitectura)

### 2.1 Principio

```
┌─────────────────────────────┐     JSON / OAuth      ┌──────────────────────────┐
│  Claver Edge Apps (SaaS)    │ ◄──────────────────►  │  Protheus AppServer REST │
│  Next.js · JWT · PostgreSQL │                       │  HTTPREST :8404 /rest    │
│  UI móvil + WhatsApp + AFIP │                       │  SIGA* + tablas Z CLV_*  │
└──────────────┬──────────────┘                       └────────────┬─────────────┘
               │                                                   │
               │  3 canales (elige el tenant)                      │
               ▼                                                   ▼
     ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐
     │ REST directo    │  │ Edge Agent VPN   │  │ SQL vistas / SQL directo│
     │ Basic Auth      │  │ OPO agent on-prem│  │ SA1010, SE1010, …       │
     │ protheus_rest   │  │ protheus_edge_   │  │ tableSuffix = 010       │
     │ _direct         │  │ agent            │  │                         │
     └─────────────────┘  └──────────────────┘  └─────────────────────────┘
```

El tenant se configura en `OpoTenantConfig` (`lib/opo/types.ts`):

- `origen: "protheus"`
- `accesoCanal`: `rest_directo` | `edge_agent` | `sql_vistas` | `sql_directo`
- `entityMappings`: Customer → SA1, Product → SB1, Invoice → SF2, Order → SC5, Supplier → SA2

La UI de Claver **no sabe** si atrás hay PostgreSQL nativo o Protheus. Consume `ErpDataAdapter`.

### 2.2 Tres modos de implantación

| Modo | Cuándo | Qué toca Protheus | Riesgo |
|------|--------|-------------------|--------|
| **A. REST estándar** | Cloud TOTVS o on-prem con `[HTTPREST]` | Solo consume APIs TOTVS existentes (Customer, Product, Order) + 1 PRW por app | Bajo. Licencia TOTVS I / Full si hay `PrepareIn` |
| **B. REST Claver (PRW)** | El estándar no cubre el flujo (aprobaciones, POS, inversiones) | Compilar `CLV*.PRW` en TDS, campos `CLV_*` en SX3, parámetros `MV_CLV*` | Medio. GMUD + RPO |
| **C. Edge Agent** | Firewall, sin exponer REST a internet | Agente en la LAN del cliente (VPN) habla con AppServer; Claver habla con el agente | Medio-bajo. Típico enterprise |

Fluig es **opcional**: workflows de aprobación pueden vivir en Fluig y Claver Approvals ser el front móvil. No es requisito.

### 2.3 Prerrequisitos de ambiente Protheus

- Protheus **12.1.2310+** (boletines actuales). REST desde 12.1.27 es usable.
- `[HTTPV11]` + `[HTTPREST]` en `appserver.ini`, `CORSEnable=1`.
- Usuario REST dedicado (`MV_CLVAPU` / USR) con privilegio mínimo a las tablas del flujo.
- Cloud TOTVS: pedir al CST la URL REST del ambiente (no asumir host interno).
- Argentina: el **CAE AFIP no sale de Protheus**. Sale de Claver (o del módulo fiscal local) y se **estampa** en SF2/SD2.

### 2.4 Contrato de una app (patrón)

Cada app empaquetable tiene:

1. **SKU** Claver (`edge.*` / `totvs.*`).
2. **Contrato REST** en `CLAVER_APP_BRIDGE_CONTRACTS`.
3. **Boletín técnico**: módulos SIGA, tablas nativas, campos custom, MV, PRW, checklist.
4. **Fuente AdvPL** en `data/protheus/advpl/edge/<app>/`.
5. **Runbook CCA** (Claver Cloud Activation) equivalente a MIT 001.

El equipo Protheus del partner implementa el PRW; Claver consume. No se customiza el core SIGA.

---

## 3. Cuña del piloto: Claver Inversiones

El compañero TOTVS propuso un módulo de **inversiones** (API de cotizaciones + tenencias del cliente). Es el mejor primer producto de la alianza: Protheus ya tiene tesorería, pero no una experiencia de portafolio.

### 3.1 Qué hace Protheus hoy (y qué no)

| En Protheus | Gap |
|-------------|-----|
| SIGAFIN tesorería: bancos, naturalezas, flujo de caja | Operativo, no mark-to-market |
| **FINA716**: aplicaciones, apropiaciones, préstamos | Backoffice. Sin UI de cartera, sin API de mercado, sin cliente final |
| TOTVS Techfin (JV Itaú) + Boleto Híbrido | Brasil-céntrico; no cubre instrumentos AR ni cotizaciones BYMA/MAE/BCRA |
| SA1 clientes, SE1 títulos | Hay *quién* debe, no *qué tiene invertido* a precio de mercado |

### 3.2 Qué reutiliza Claver (ya hay código)

| Capacidad Claver | Dónde | Reuso para Inversiones |
|------------------|-------|------------------------|
| Maestro `Moneda` + histórico `Cotizacion` (oficial / MEP / CCL / blue / tarjeta) | `prisma/schema.prisma` | FX ARS/USD/BRL |
| Pizarra de granos (BCR) | `lib/agro/agro-service.ts` `pizarraActual` | Mismo patrón: cron + última cotización |
| Cuentas bancarias / BCRA | `Banco`, `CuentaBancaria` | Cuentas de custodia |
| Préstamos / cuotas | `/dashboard/prestamos` | Pata “pasivo” del portafolio |
| Cashflow | `/dashboard/cashflow` | Caja + inversiones en una vista |
| Portal cliente | `/claver-cliente`, `/portal` | Tenencias visibles al cliente (banco / ALyC / tesorería) |
| WhatsApp | `com.whatsapp` | Alerta “tu ON cayó 3%” / vencimiento plazo fijo |
| Legacy Bridge | adapters + boletines | Mismo empaquetado que Approvals/POS |

**No existe hoy** un modelo `Tenencia` / `Instrumento` / `Valuacion`. El piloto lo agrega; no se finge que ya está.

### 3.3 Dominio del módulo

```
Instrumento          Tenencia (por cliente o por empresa)
─────────────        ────────────────────────────────────
código, ISIN         clienteId ↔ SA1 (A1_COD)
tipo: PF | FCI |     cantidad / valor nominal
  ON | CEDEAR |      precioCosto, moneda
  LECAP | USD |      custodia (banco / ALyC / caja)
  GRANO | CDB        empresaId (multi-tenant)
mercado: BYMA|MAE|
  BCRA|BCR|BCB

CotizacionTick       ValuacionDiaria
──────────────       ───────────────
instrumentoId        tenenciaId
fuente API           pxClose, mtmArs, mtmUsd
px, ts               pnl, pnlPct
```

Fuentes de cotización (conectar, no scrapear UI):

| Mercado | API típica | Uso |
|---------|------------|-----|
| FX AR | BCRA / DolarAPI / Ámbito | MEP, CCL, oficial — ya modelado en `Cotizacion` |
| Renta fija / CEDEAR AR | BYMA (si hay contrato) o proveedor de mercado | ON, LECAP, CEDEAR |
| Brasil (si el tenant es BR) | B3 / provedor local | CDB, fundos — alinea FINA716 |
| Granos | BCR Rosario (patrón pizarra Claver) | Acopio / tesorería agro |
| Internacional | proveedor con licencia (no Yahoo en producción) | ADR / overlay |

### 3.4 Integración Protheus — Inversiones

**SKU propuesto:** `edge.investments` / comercial: **Claver Inversiones**.

| Dirección | Origen | Destino | Método | Hint Protheus |
|-----------|--------|---------|--------|---------------|
| Salida | SA1 | Claver (padron clientes) | `GET /api/fin/v1/customers` | ya suele existir REST Fin |
| Salida | FINA716 / tabla de aplicaciones | Claver tenencias seed | `GET /api/claver/v1/investments/holdings` | FINA716; si no hay REST, PRW `CLVINV01` |
| Salida | SE8 / saldos bancarios | Caja del portafolio | REST Fin bancos | SIGAFIN |
| Entrada | Claver valuación diaria | asiento / título | `POST /api/claver/v1/investments/valuation` | SIGACTB CT2 o naturaleza tesorería |
| Entrada | Alta/rescate en Claver | aplicación FINA716 | `POST .../holdings` | no duplicar: UUID `CLV_ID` en ZCL030 |

Campos custom (borrador de boletín):

| Tabla | Campo | Tipo | Uso |
|-------|-------|------|-----|
| ZCL030 | CLV_ID | C 36 | UUID tenencia Claver |
| ZCL030 | CLV_INS | C 20 | código instrumento |
| ZCL030 | CLV_QTD | N 18,6 | cantidad |
| ZCL030 | CLV_MTM | N 14,2 | mark-to-market última corrida |
| SA1 | CLV_INV | C 1 | cliente con portafolio (S/N) |
| MV_CLVINV | L | .T. | activa integración |

Flujo feliz:

1. Partner compila `CLVINV01.PRW` + crea ZCL030.
2. Claver Cloud: tenant `origen=protheus`, mapeo Customer → SA1.
3. Sync nocturno de tenencias (o on-demand).
4. Cron de cotizaciones (15–60 min en horario de mercado).
5. UI `/dashboard/inversiones` (tesorería) + `/claver-cliente/inversiones` (tenencias del cliente).
6. Alerta WA si mtm vs costo supera umbral.
7. Al cierre, asiento de valuación opcional en SIGACTB (parametrizable; default off en PyME).

### 3.5 Qué **no** es este módulo

- No es ALyC / broker regulado CNV (no custodia títulos).
- No es home banking.
- No compite con Techfin en boletos BR.
- No pisa FINA716: lo **lee** y, si el cliente quiere, le **escribe** aplicaciones con idempotencia.

---

## 4. Catálogo de apps empaquetables para el canal TOTVS

Criterio: se vende **como app encima de Protheus**, no como ERP Claver completo.  
Madurez:

- **P0** — puente o producto con código + contrato; piloto en 2–6 semanas.
- **P1** — producto Claver real; falta PRW/boletín o un gap de dominio.
- **P2** — empaquetable después; no prometer en el primer deal.

### Ola 0 — Ya hay contrato + PRW + boletín (`edge.*`)

Estas cinco ya están en `CLAVER_APP_BRIDGE_CONTRACTS` y `data/protheus/advpl/edge/`. Los PRW son **esqueleto** (validan JSON; el `MaFatura` / `MaAprov` real hay que cerrarlo con el analista TOTVS en el piloto).

| # | App | SKU | Protheus | Valor 30 s |
|---|-----|-----|----------|------------|
| 1 | **Claver Approvals** | `edge.approvals` | SCR, SC1/SC7, MATA020, SIGACOM/SIGAFIN | Aprobar OC y pagos desde el celular |
| 2 | **Claver Expenses** | `edge.expenses` | SE1, CT1, SA1, ZCL010/011 | Viáticos con OCR → título a pagar |
| 3 | **Claver B2B Portal** | `edge.b2b` | SC5/SC6, SF2, SE1, SB1/SB2 | Cliente carga pedido y ve cuenta |
| 4 | **Claver POS / Kiosk** | `edge.pos` | MATA410, SF2/SD2, SB1/SB2 | Mostrador rápido; backoffice intacto |
| 5 | **Claver Warehouse** | `edge.warehouse` | MATA650, SC9, SB2, SD3 | Picking con escáner |

### Ola 1 — Máximo diferencial AR / last-mile (vender con Inversiones)

| # | App | SKU Claver | Encaje Protheus | PyME | Grande |
|---|-----|------------|-----------------|------|--------|
| 6 | **Claver Inversiones** | `edge.investments` *(nuevo)* | FINA716, SA1, CT2, SE8 | Tesorería dueño | Tesorería + portal cliente / ALyC light |
| 7 | **AFIP / factura AR** | `fiscal.cert_afip` | SF2/SD2 (estampa CAE) | Cumplir AR sin módulo BR | Multi-CUIT / CAEA contingencia |
| 8 | **Cobrá WhatsApp** | `intang.cobranzas_wa` + `com.whatsapp` | SE1 aging | Recupero sin llamar | Secuencias D+1/D+7 a escala |
| 9 | **OCR Compras** | `intang.ocr_compras` / `fiscal.ocr` | SD1/SF1, SA2 | Cargar factura con foto | Cola mail + matching |
| 10 | **Conciliador MP / tarjetas** | `intang.liquidacion_pagos` | SE5 / conciliación | “¿dónde está la plata de MP?” | Multi-adquirente |
| 11 | **Links de cobro** | `fiscal.clavpay_link` | baja SE1 | Cobrar por MP | Recurrencia + seña |
| 12 | **Recuperador retenciones** | `intang.recuperador_fiscal` | SIGACTB / padrón | Percepciones perdidas | Apócrifos + IIBB |

### Ola 2 — Verticales que el canal TOTVS no cubre bien en AR

| # | App | SKU | Encaje | Nota de madurez |
|---|-----|-----|--------|-----------------|
| 13 | **Hospitalidad (KDS / mesas / mozo)** | hospitalidad dashboard | SIGALOJA / pedido SC5 | Fuerte en Claver; POS TOTVS Food es otro stack — posicionar como overlay AR |
| 14 | **Agro (pizarra, liquidaciones, acopio)** | agro + `niche.acopio_grano` | SIGAEST + tesorería | Pizarra BCR reutilizable; IoT campo no vender como PRD |
| 15 | **Consorcios / expensas** | `niche.consorcios` | SA1 + SE1 | Mini-SaaS; Protheus no tiene PH |
| 16 | **Alquileres / garantía** | `micro.renta_dueno` | contratos + SE1 | Dueño 1–10 dptos o inmobiliaria chica |
| 17 | **Vendedor en ruta** | `micro.claver_ruta` / `/vendedor` | SC5 + SB2 + GPS `ops.gps` | Fuerza de venta con stock del camión |
| 18 | **Agenda / turnos** | `ops.agenda_web` / `micro.confirma_turnos` | no hay par SIGA | Salud, oficios, vet |
| 19 | **Membresías / club** | `niche.club_barrio` | SE1 cuotas | Gimnasio / club |
| 20 | **Fiado barrio** | `pos.fiado_barrio` | cuenta corriente SA1 | Enganche retail; ancla $0 Claver — **no** comisiona TOTVS el $0 |

### Ola 3 — Enterprise overlay (pack “Protheus + Claver Edge”)

| # | App | SKU | Encaje |
|---|-----|-----|--------|
| 21 | **Helpdesk IA** | `data.helpdesk_ia` | tickets sobre docs del ERP |
| 22 | **Mañanero (KPI mail)** | `data.reportes_prog` | ventas/caja/stock del día |
| 23 | **Automation Hub (n8n)** | `bridge.n8n_automations` | eventos: CAE retry, OC, WA |
| 24 | **Guardián POS** | `intang.guardian_pos` | anulaciones / egresos raros |
| 25 | **Reponedor JIT** | `intang.reponedor_jit` | SB2 + lead time → OC |
| 26 | **Ruteador entregas** | `intang.ruteador_entregas` | logística last-mile |
| 27 | **MFA / Backup** | `sec.mfa`, `sec.backup` | complemento TCloud, no lo pisa |

### Qué **no** empaquetar como app TOTVS (todavía)

| Item | Por qué |
|------|---------|
| ERP Claver Core como “alternativa a Protheus” | Canibaliza al canal; rompe la tesis |
| IoT agro / AIoT como PRD | En repo hay stubs; no prometible |
| VPN, DNS, EDR, email corporativo | No es diferencial TOTVS; diluye |
| Techfin / boletos BR | Territorio TOTVS; no competir |
| PRW con `TODO: MaFatura` sin piloto | El boletín existe; la homologación no |

---

## 5. Mapa de integración por app (tablas y APIs)

### 5.1 Ola 0 (detalle ya en código)

| SKU | REST Claver | Tablas | Trigger AdvPL |
|-----|-------------|--------|---------------|
| `edge.approvals` | `GET /api/claver/v1/approvals/pending` · `POST .../approve` · `POST .../reject` | SCR, SC1, SC7, SE1 | `MaAprov` / workflow MATA020. Campos `CLV_APROV`, `CLV_USR`, `CLV_DTA` |
| `edge.expenses` | `POST/GET /api/claver/v1/expenses` | ZCL010/011 → SE1 + CT1 | Inyección título a pagar al aprobar |
| `edge.b2b` | `GET/POST orders` · `GET invoices` · `GET products` | SC5/SC6, SF2, SE1, SB1/SB2 | Pedido portal = SC5; stock SB2 |
| `edge.pos` | `POST /api/claver/v1/pos/tickets` | SF2/SD2, SB1/SB2 | MATA410 / MaFatura. `CLV_POS`, `CLV_CAJ`. Fiscal AR **fuera** |
| `edge.warehouse` | `GET picking-tasks` · `POST .../confirm` | SC9, SB2, SD3, ZCL020 | MATA650 |

Fuentes: `CLVAPR01.PRW`, `CLVEXP01/02.PRW`, `CLVB2B01.PRW`, `CLVPOS01.PRW`, `CLVWMS01.PRW`.

### 5.2 Patrón fiscal Argentina (crítico)

```
Venta en Claver POS
    → CAE AFIP (Claver, WSAA/WSFE)
    → POST ticket a Protheus (SF2.F2_CHVNFE o campo CLV_CAE + número)
    → stock SB2 y título SE1 nativos
```

Protheus no emite CAE AR. Si el cliente ya factura con un add-on AR, Claver **o** el add-on es el emisor: no dos CAE. Decidirlo en el relevamiento.

### 5.3 Cobranzas

```
SE1 (abiertos, vencidos)  --GET-->  Claver aging
Claver secuencia WA D+1/D+7
Pago MP / link            --POST-->  baja / movimiento SE5 (o recibo)
```

Idempotencia por `externalId` del pago. No duplicar bajas.

### 5.4 Inversiones (nuevo, ver §3.4)

Entidad canónica OPO a agregar cuando se implemente: `Holding` / `Instrument` (hoy el enum OPO es solo Customer, Product, Invoice, Order, Supplier).

---

## 6. Valor agregado

### 6.1 PyME (1–50 usuarios, 1–3 sucursales)

Perfil: ya compró Protheus (o lo hereda) y opera el 40% del día en Excel / WhatsApp / mostrador.

| Dolor | App | Efecto medible |
|-------|-----|----------------|
| El dueño no abre Protheus para aprobar una OC de $800k | Approvals | Horas de ciclo SC7: de días a minutos |
| Tesorería = saldo banco + “tengo dólares en el colchón / PF” | Inversiones | Posición neta ARS/USD/MTM en una pantalla |
| Cobranzas = llamar | Cobrá WA | 1 factura cobrada a tiempo paga meses de SaaS |
| Mostrador lento vs. backoffice | POS Claver | Ticket en segundos; stock/factura en SIGA |
| Factura de compra a mano | OCR | Carga en 30 s |
| Cliente mayorista pide por WhatsApp | B2B Portal | Pedido SC5 sin vendedor interno |
| AFIP es un infierno al lado de NFe | AFIP Claver | CAE en el cierre de caja |

**Pack PyME sugerido (SKU comercial):** `pool-totvs-pyme-ar`

- Inversiones (si hay tesorería) **o** POS (si hay mostrador)
- Cobrá WA + links
- AFIP
- Approvals

Precio de lista Claver (orientativo, ARS/mes, sujeto a HUM): apps sueltas $10k–$25k; pack $49k–$89k. Setup partner TOTVS: 8–24 h ADVPL + CCA.

### 6.2 Gran empresa (multi-filial, TOTVS Cloud, Fluig, shared services)

Perfil: Protheus es intocable. Quieren overlay, no otro ERP. Compliance, SSO, ambientes VAL/PRD.

| Dolor | App | Efecto medible |
|-------|-----|----------------|
| Aprobadores en viaje / home office | Approvals + Fluig | Mismo workflow MATA020, canal móvil |
| Tesorería con aplicaciones FINA716 ciegas al mercado | Inversiones | MTM diario, PnL, alertas, asiento CT2 |
| Fuerza de venta / gastos | Expenses + Ruta | SE1 + GPS + OCR |
| B2B con 200 clientes | Portal | Self-service; menos CS |
| WMS de piso vs. MATA650 de escritorio | Warehouse | Confirmación RF → SB2 |
| Shared service de CxC | Cobrá WA + Mañanero | Cola, SLA, KPI mail CFO |
| Controllers quieren VAL→PRD | Claver Cloud (CCA) | Equivalente TCloud ONBOARD / MIT 001 |
| No exponer REST a internet | Edge Agent | Canal VPN |

**Pack Enterprise:** `pool-totvs-edge`

- Approvals + Expenses + B2B + Warehouse
- Inversiones (tesorería)
- Automation Hub
- Helpdesk IA sobre el propio runbook
- MFA

Setup: proyecto 2–6 semanas, GMUD, usuario REST, boletines firmados. Precio: setup USD/ARS proyecto + SaaS por app × sede.

### 6.3 Mensaje al canal TOTVS (no al cliente final)

> “No les pedimos que dejen Protheus. Les damos apps que el cliente pide (móvil, WhatsApp, AFIP AR, portafolio) y que ustedes implementan y comisionan. El core SIGA no se toca.”

Eso desbloquea: más módulos SIGA licenciados (si el overlay **usa** FINA716 / MATA020 / MATA650), horas de AMS, y retención del cliente que se iba a un SaaS paralelo.

---

## 7. Modelo comercial y comisiones

### 7.1 Figura TOTVS (oficial)

Fuente: [Programa de Parceiros TOTVS](https://www.totvs.com/seja-um-parceiro/). Elegir **una** y no mezclar en el primer contrato:

| Figura | Qué implica | Cuándo |
|--------|-------------|--------|
| **Solução de Negócios** | La app entra al portafolio TOTVS; la venden franquicias | Objetivo 12 meses, post-homologación |
| **Integración homologada** | TOTVS sella el puente Protheus ↔ Claver | Primeros 1–3 clientes |
| **Software embarcado** | Claver inside un producto TOTVS | Solo si Producto TOTVS lo pide |
| **Solución recomendada** | Indican Claver; menos GTM conjunto | Arranque con el compañero |

Términos típicos TDN (Specialist / Recommended): TOTVS (o el canal) cobra al cliente y **reparte según Quadro Resumo** post-liquidez; o Claver factura al cliente e informa ventas de indicación. Los % **no están en este doc**: van al anexo comercial HUM.

### 7.2 Tres bolsillos de plata (no mezclar)

| Bolsillo | Quién factura | Quién cobra comisión |
|----------|---------------|----------------------|
| **Licencia / cloud Protheus** | TOTVS / franquicia | Canal TOTVS (su modelo) |
| **SaaS Claver (apps)** | Claver (MP / factura AR) | Canal TOTVS + compañero implementador |
| **Horas ADVPL + CCA** | Compañero / franquicia | 100% de quien implementa (alineado a `PROGRAMA_PARTNER_CLAVER.md`) |

### 7.3 Propuesta de split SaaS (borrador interno, no publicado)

Alineado al partner Claver actual (`lib/partners/affiliate-config.ts`: seller 30% N1, implementer 20%, bounty 1er mes 100% del extra pago):

| Rol | SaaS mensual apps TOTVS-pack | Setup |
|-----|------------------------------|-------|
| Franquicia / canal que cierra | 25–30% mientras el contrato viva | 0% (no lo factura) |
| Compañero implementador | 20% si no es el closer; **o** 100% del setup | 100% horas |
| Claver Soft | resto (hosting, AFIP, WA, producto) | — |
| TOTVS corporativo (si Solução de Negócios) | % Quadro Resumo (suele 10–30% sobre lo que pasa por caja TOTVS) | según contrato |

Reglas:

- Ancla Claver $0 (`pos.fiado_barrio`) **no** comisiona.
- Comisión sobre **neto cobrado**, clawback 30 días si hay reembolso (mismo criterio actual).
- Si TOTVS factura el SaaS (modelo Specialist), Claver emite a TOTVS según Relatório de Recebimento; no al cliente.
- Si Claver factura (Recommended), reporte día 10 con CNPJ/CUIT, SKU, neto.

### 7.4 Quién vende qué en la reunión

| Persona | Habla de | No habla de |
|---------|----------|-------------|
| Compañero TOTVS | Protheus, FINA716, GMUD, horas, confianza del cliente | Precios Claver de calle / fiado $0 |
| Claver | Apps, AFIP AR, WhatsApp, Inversiones UI, SLA SaaS | “Nosotros reemplazamos SIGAFIN” |
| Humano Claver (HUM) | Split, lista, piloto, legal CNV si Inversiones se va de tesorería a oferta pública | — |

---

## 8. Plan de 90 días con el compañero

### Semanas 1–2 — Alcance

1. Elegir **un** cliente piloto (ideal: PyME AR con Protheus 12 + tesorería, o retail con mostrador).
2. Elegir **una** app cuña: Inversiones **o** POS **o** Approvals (no las tres).
3. Inventario: versión Protheus, Cloud vs on-prem, REST prendido, Fluig sí/no, emisor fiscal AR.
4. Firmar figura de partner (Recommended alcanza para el piloto).

### Semanas 3–6 — Puente

1. Ambiente VAL: `[HTTPREST]` + usuario REST.
2. Compilar PRW de la app cuña; campos `CLV_*`.
3. Tenant Claver `origen=protheus`, test `bridgeTestOk`.
4. Si Inversiones: 1 fuente de cotización (FX) + 1 instrumento + 3 tenencias de prueba SA1.
5. Checklist del boletín técnico (ya hay plantilla en `technical-bulletins.ts`).

### Semanas 7–10 — UAT / go-live

1. UAT con el usuario real (tesorero / cajero / aprobador).
2. VAL → PRD (CCA / equivalente TCloud).
3. Runbook de soporte L1 en la franquicia + L2 Claver.
4. Case 1 página para el canal (antes/después, horas, ARR).

### Semana 12 — Decisión de portafolio

- Homologar integración.
- Armar `pool-totvs-pyme-ar` y lista para el canal.
- Segunda app del mismo cliente (upsell típico: Inversiones → Cobrá, o POS → AFIP).

---

## 9. Entregables técnicos por app (definición de “empaquetada”)

Una app está lista para el canal TOTVS cuando existen:

- [ ] SKU en marketplace Claver + precio + `autoCertLevel`
- [ ] Contrato REST (`api-contracts.ts`)
- [ ] Boletín (`technical-bulletins.ts`) con tablas, MV, PRW, seguridad
- [ ] Fuente `.PRW` compilable (sin `TODO` de negocio en el camino feliz)
- [ ] UI golden path + portal si aplica
- [ ] Tests: adapter Protheus demo + 1 caso REST
- [ ] Runbook analista (Claver Cloud)
- [ ] One-pager canal (dolor, módulos SIGA que **se usan**, no se pisan)
- [ ] Matriz de soporte L1/L2

Ola 0 cumple contrato + boletín + PRW esqueleto. **Falta** cerrar rutinas nativas (`MaAprov`, `MaFatura`) en el piloto. Inversiones parte de cero de dominio y reusa Bridge + `Cotizacion` + pizarra.

---

## 10. Referencias internas

| Tema | Path |
|------|------|
| Bridge y tipos | `lib/legacy-bridge/types.ts` |
| Contratos | `lib/legacy-bridge/api-contracts.ts` |
| Boletines | `lib/legacy-bridge/technical-bulletins.ts` |
| Adapters | `lib/legacy-bridge/adapters/protheus-rest.ts`, `protheus-agent.ts` |
| AdvPL | `data/protheus/advpl/edge/` |
| SKUs | `lib/marketplace/marketplace-catalog.ts` |
| Nichos | `lib/niche/niche-apps-catalog.ts` |
| Micro-SaaS | `lib/comercial/micro-saas-portfolio.ts` |
| Partner Claver (comisiones actuales) | `docs/comercial/PROGRAMA_PARTNER_CLAVER.md` |
| Qué se puede vender en PRD | `docs/GO_LIVE_PRD.md` |
| CCA / MIT 001 | `docs/operaciones/CLAVER_CLOUD_PROCESO_IMPLEMENTACION.md` |

---

## 11. Decisión que hay que tomar en la próxima reunión

1. **App cuña:** Inversiones vs Approvals vs POS. Recomendación: **Inversiones** si el cliente del compañero es tesorería/finanzas; **POS+AFIP** si es retail AR; **Approvals** si es industria con MATA020 ya vivo.
2. **Figura legal TOTVS:** Recommended (rápido) vs Integración homologada (más peso de canal).
3. **Quién factura el SaaS** en el piloto: Claver directo (simple) vs caja TOTVS (escala).
4. **Cliente piloto** con REST o con permiso de GMUD en 30 días.

Sin esos cuatro puntos no se escribe ADVPL de más ni se arma lista de precios pública.
)
