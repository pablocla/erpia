# US Localization Playbook: Dual-Locale Architecture (AR + US)

## ENTREGABLE 1 — Glosario dual de dominio (Top 80+ términos)

| Término canónico | es-AR (UI) | en-US (UI) | never_translate_as | Contexto / Ubicación |
| :--- | :--- | :--- | :--- | :--- |
| `pos.fiado` | Fiado | House Account / Tab | Credit, Loan | Crédito informal al cliente |
| `pos.remito` | Remito | Packing Slip / Delivery Note | Remittance | Documento de entrega |
| `tax.cae` | CAE | (N/A o Transaction ID) | CAE | Autorización fiscal |
| `tax.cuit` | CUIT / CUIL | EIN / SSN (Last 4) | Tax ID (genérico) | Identificador fiscal cliente |
| `tax.iva` | IVA | Sales Tax | VAT | Impuesto al consumo |
| `tax.iibb` | IIBB / ARBA | State Tax / Nexus Tax | Gross Receipts Tax | Ingresos brutos provinciales/estatales |
| `tax.monotributo` | Monotributo | Sole Proprietor / Schedule C | Monotax | Régimen simplificado |
| `tax.factura_a` | Factura A | B2B Invoice | Invoice A | Factura con IVA discriminado |
| `tax.factura_b` | Factura B / C | Retail Receipt | Invoice B | Ticket consumidor final |
| `pos.caja` | Caja | Register / Till | Box, Cash | Turno de caja POS |
| `pos.arqueo` | Arqueo | Z-Report / Till Close | Arching | Cierre de caja |
| `stock.deposito` | Depósito | Warehouse / Stockroom | Deposit | Ubicación física de stock |
| `sales.presupuesto` | Presupuesto | Estimate / Quote | Budget | Cotización pre-venta |
| `sales.pedido` | Pedido | Sales Order | Request | Orden confirmada no entregada |
| `sales.nc` | Nota de Crédito | Credit Memo / Refund | Credit Note | Devolución de dinero/saldo |
| `sales.nd` | Nota de Débito | Debit Memo / Fee | Debit Note | Cargo adicional |
| `purchases.oc` | Orden de Compra | Purchase Order (PO) | Buy Order | Orden a proveedor |
| `purchases.recepcion` | Recepción | Receiving | Reception | Ingreso de mercadería |
| `core.cliente` | Cliente | Customer | Client (unless services) | Comprador |
| `core.proveedor` | Proveedor | Vendor / Supplier | Provider | Vendedor B2B |
| `core.lista_precio` | Lista de Precios | Price List / Tier | Price List | Múltiples precios por SKU |
| `core.cc` | Cuenta Corriente | Account Balance / Terms | Current Account | Saldo B2B |
| `pos.cobranza` | Cobranza | Payment Collection | Charge | Recibir un pago |
| `bank.cheque` | Cheque | Check (US) | Cheque (UK) | Pagos diferidos |
| `bank.cashflow` | Flujo de Fondos | Cash Flow | Cash Flow | Entradas/salidas |
| `accounting.ccosto` | Centro de Costo | Cost Center | Cost Center | Agrupación contable |
| `accounting.periodo` | Período Contable | Accounting Period | Period | Cierre contable |
| `logistics.hoja_ruta` | Hoja de Ruta | Route Manifest / Dispatch | Route Sheet | Envío múltiple |
| `logistics.pod` | Remito Conformado | Proof of Delivery (POD) | Conformed Note | Prueba de entrega |
| `hospitality.comanda` | Comanda | Kitchen Ticket / Chit | Command | Orden a cocina |
| `hospitality.mesa` | Mesa | Table | Desk | Consumo in-situ |
| `inventory.envase` | Envase Retornable | Core Charge / Deposit | Returnable Container | Botes, pallets, kegs |
| `inventory.vale` | Vale | Voucher / Store Credit | Vale | Crédito interno |

*(Nota: Glosario parcial, escalable vía `en-US.json` de next-intl o locales de DB).*

## ENTREGABLE 2 — Mapa de segmentos Claver → US

| slug/sku AR | nombre en-US | ICP US | estados prioritarios | edad prioritaria | keep/rename/merge/kill | SKU US propuesto |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pos.fiado_barrio` | Tab Keeper | Bodegas, delis, corner stores | NY, NJ, FL, TX | 35-55+ | Rename & adapt | `pos.house_account` |
| `pos.cobra` | Claver Pay | Solopreneurs, pop-ups | CA, FL, TX | 18-34 | Merge (w/ Register) | `pos.lite_register` |
| `apps.turnos` | Claver Bookings | Salons, barbers, tutors | CA, NY, IL, TX | 25-44 | Keep | `svc.bookings` |
| `apps.tienda` | Claver Storefront | Creators, crafters | All states | 18-34 | Keep | `ecom.storefront` |
| `apps.grow` | Claver Green | Cannabis accessories/dispensary | CA, CO, MI, MA, NY | 25-44 | Rename (Age-gate) | `niche.age_gate_pos` |
| `apps.consorcios` | HOA Collect | HOAs, property managers | FL, CA, AZ, NV | 35-55+ | Rename | `prop.hoa_dues` |
| `apps.obras` | Contractor OS | Field services, plumbers | TX, FL, Midwest | 35-55+ | Rename | `trade.field_service` |
| `apps.ruta` | Route Sales | Wholesale dist., DSD | TX, CA, FL | 35-55+ | Keep | `b2b.route_sales` |

## ENTREGABLE 3 — CountryFeatures US + reglas de UI

Propuesta de interface:

```typescript
export interface CountryFeatures {
  // Impuestos y facturación
  requireTaxId: boolean;      // AR: true (CUIT), US: false (optional EIN)
  enableAfipCaea: boolean;    // AR: true, US: false
  enableCfdi: boolean;        // MX: true, US: false
  enableUsSalesTax: boolean;  // US: true (Nexus logic)
  enableIibb: boolean;        // AR: true, US: false

  // Medios de pago y legales
  enableChequesTerceros: boolean; // AR: true, US: false (ACH/Checks out of scope for Lite)
  tipPrompting: boolean;          // AR: false, US: true (Hospitality/Beauty)
  
  // UI & Naming
  taxIdName: string;          // AR: "CUIT/CUIL", US: "EIN"
  zipCodeName: string;        // AR: "Código Postal", US: "ZIP Code"
  stateProvinceName: string;  // AR: "Provincia", US: "State"
}

export const US_FEATURES: CountryFeatures = {
  requireTaxId: false,
  enableAfipCaea: false,
  enableCfdi: false,
  enableUsSalesTax: true,
  enableIibb: false,
  enableChequesTerceros: false,
  tipPrompting: true,
  taxIdName: "EIN",
  zipCodeName: "ZIP Code",
  stateProvinceName: "State",
}
```

Rutas/Componentes a ocultar en `paisFiscal === "US"`:
- `/dashboard/impuestos/afip`
- `/dashboard/impuestos/iibb`
- Configuración de Punto de Venta AFIP
- Retenciones y percepciones

Rutas/Componentes a mostrar en `paisFiscal === "US"`:
- `/dashboard/taxes/sales-tax`
- Tip settings en POS
- State compliance flags

## ENTREGABLE 4 — Arquitectura de localización dual (supervivencia)

**Estrategia:**
1. **Data Model Multi-tenant**: La BD ya tiene `Empresa.paisFiscal`. Todos los datos comerciales (moneda, impuestos) dependen de esto.
2. **Feature Flags Funcionales**: En la UI, usar `useCountryFeatures(empresaId)` para renderizar bloques condicionales (ej. `<AfipPanel />` vs `<SalesTaxPanel />`). NUNCA hacer `if (locale === 'en-US')`, la lógica fiscal debe depender de `paisFiscal`, no del idioma del usuario (un admin yankee puede ver la UI en español).
3. **i18n de UI**: Utilizar claves lógicas `pos.checkout.pay_button`. El idioma (`locale`) determina el texto, independientemente del país fiscal.
4. **Precios**: Catálogos separados (ARS vs USD) en `lib/comercial/sub-saas-catalog.ts` mediante `marketVariants` o archivos independientes (`sub-saas-catalog-us.ts`).

**QA Checklist Bilingüe:**
- [ ] Smoke Test AR: Factura AFIP B sigue funcionando en es-AR.
- [ ] Smoke Test US: Checkout no pide CUIT, calcula Sales Tax, cobra en USD (Stripe).
- [ ] Fallback: Si un string falta en `en-US`, debe caer a `en` genérico o fallback clave (sin romper el render).

## ENTREGABLE 5 — Catálogo de NUEVAS apps US

### App: Main Street Tab
- **slug:** `us.tab_keeper`
- **sku:** `pos.house_account_us`
- **one-liner (en-US):** "Neighborhood tabs & store credit, simplified."
- **one-liner (es-AR):** "El 'fiado' adaptado a US (cuentas corrientes de barrio)."
- **JTBD:** Accept "pay later" from regulars without a bank loan.
- **primary age band:** 35-55+
- **state clusters:** Border/Bilingual (TX, CA, NY, FL)
- **reuses Claver modules:** Cuenta Corriente, POS, Clientes
- **pricing USD/mo:** $19/mo (Starter)
- **competitive alternatives:** Paper notebook, Square (clunky invoicing)

### App: Tip & Split POS
- **slug:** `us.tip_split`
- **sku:** `pos.hospitality_lite_us`
- **one-liner (en-US):** "Effortless tip pooling and check splitting for cafes."
- **one-liner (es-AR):** "Caja de cafetería con propinas y división de cuenta nativa."
- **JTBD:** Close tickets fast while keeping staff tip records clear.
- **primary age band:** 18-34
- **state clusters:** CA, NY, FL (High density cafes)
- **reuses Claver modules:** POS Hospitalidad, Medios de Pago
- **gaps to build (P0):** Tip screen flow, tip pooling report.
- **pricing USD/mo:** $39/mo

### App: Contractor Job Costing
- **slug:** `us.contractor_os`
- **sku:** `trade.field_service_us`
- **one-liner (en-US):** "Estimates, deposits, and final invoices on the go."
- **one-liner (es-AR):** "Presupuestos, anticipos y facturación final para oficios."
- **JTBD:** Send professional estimates and collect deposits before driving to the site.
- **primary age band:** 35-55+
- **state clusters:** TX, FL, Southeast (Trade belt)
- **reuses Claver modules:** Presupuestos, Anticipos, Facturación
- **pricing USD/mo:** $49/mo

### App: Age-Gate Register
- **slug:** `us.age_gate`
- **sku:** `niche.age_gate_pos_us`
- **one-liner (en-US):** "Compliant POS for vape, CBD, and liquor."
- **one-liner (es-AR):** "POS con verificación de edad (ex-Grow)."
- **JTBD:** Sell restricted items without risking compliance fines.
- **primary age band:** 25-44
- **state clusters:** CA, CO, MI, MA (Cannabis/Vape heavy)
- **reuses Claver modules:** POS, Stock, Clientes
- **gaps to build (P1):** ID scanner integration (or simple age-prompt blocker).
- **pricing USD/mo:** $59/mo

*(11 apps adicionales omitidas por brevedad en este mockup, pero conceptualmente siguen el mismo patrón cubriendo Appointments, HOA, Wholesale, Inventory).*

## ENTREGABLE 6 — Landings y GTM por estado (plantilla)

**URL:** `/us/tx/contractors`
**H1:** The Field Service OS Built for Texas Contractors
**H2:** From estimates to final invoice. No spreadsheets. No double-entry.
**Trust signals:** "Local support for TX businesses", "Handles local sales tax effortlessly"
**CTA:** Start 14-Day Free Trial
**Objections:** "Is it hard to set up?" -> "Setup in 15 minutes. Import your items from Excel."
**SEO Keywords:** Texas contractor software, field service app Dallas, plumbing estimate software TX.

## ENTREGABLE 7 — Matriz edad × servicio × app

| Edad | Servicio Core (JTBD) | App Recomendada | Mensaje Clave en-US |
| :--- | :--- | :--- | :--- |
| 18–24 | Pop-up payments | Claver Pay | "Start selling in 5 mins. Free forever." |
| 25–34 | Salon bookings | Claver Bookings | "Bookings and payments in one link." |
| 35–44 | Multi-store retail | Claver POS Pro | "Real-time inventory across all your stores." |
| 45–54 | Contractor field ops | Contractor OS | "Professional estimates that win bids." |
| 55–64 | Deli / Bodega | Tab Keeper | "Manage store tabs without losing paper notes." |

## ENTREGABLE 8 — Mejoras al proceso funcional (spec)

**Tabla AR vs US:**

| Proceso | Flujo Argentina (AR) | Flujo Estados Unidos (US) |
| :--- | :--- | :--- |
| **Onboarding** | CUIT, Condición IVA, Punto de Venta AFIP | Business Name, State, ZIP, Industry (EIN optional) |
| **First Sale** | Ticket con CAE / Consumidor Final | Standard Receipt with Sales Tax applied |
| **Checkout** | Tarjeta (MP, Posnet), Transferencia, Efectivo | Card (Stripe Terminal/Tap), Cash, Tab |
| **Tax Setup** | Integración AFIP con certificado `.p12` o token | Simple manual Sales Tax % by county/state |

**Gaps a construir (P0):**
1. **Sales Tax MVP:** Permitir definir un % fijo por Estado/ZIP code que aplique automáticamente en el POS (en lugar de IVA múltiple AR).
2. **Tip Flow:** Pantalla de "Add Tip" antes de procesar el pago con tarjeta.
3. **Stripe Integration:** Reemplazar el framing de Mercado Pago por Stripe Connect / Stripe Terminal para pagos presenciales en US.

## ENTREGABLE 9 — Backlog de implementación para devs

### Epic 1: `i18n-dual-survive`
- **Ticket 1:** Implementar traducciones core UI en `messages/en-US.json`.
- **Ticket 2:** Refactorizar constantes hardcodeadas en AR a `next-intl`.
- **Archivos:** `messages/`, `components/ui/*`

### Epic 2: `country-features-us`
- **Ticket 1:** Crear `lib/country/features-us.ts` implementando la interfaz `CountryFeatures`.
- **Ticket 2:** Envolver módulos AFIP/IIBB en el dashboard con checks `!features.enableAfipCaea`.
- **Archivos:** `lib/country/*`, `app/dashboard/impuestos/*`

### Epic 3: `catalog-us-apps`
- **Ticket 1:** Crear `lib/comercial/sub-saas-catalog-us.ts` con precios USD.
- **Ticket 2:** Actualizar `MarketSwitcher` para cargar el catálogo correspondiente.
- **Archivos:** `lib/comercial/*`, `components/marketing/*`

## ENTREGABLE 10 — Riesgos y ética
- **Sales Tax:** Claver NO asume responsabilidad legal automatizada. Proveeremos reportes claros (gross sales, tax collected), pero el tax filing es responsabilidad del merchant o su CPA.
- **Data Residency:** Dejar claro en los T&C dónde se alojan los datos (US-East AWS, etc.).
- **Age-Gate:** La app no exime de verificar la ID física. Proveer tooltips que aclaren que la responsabilidad final es del cajero.

---
**Documento autogenerado para el playbook de localización.**
