# Emisión fiscal POS — AFIP + impresoras + etiquetas

> Actualizado: 2026-07-18

## Modelo (orden correcto)

```
1. Decisión de comprobante (parámetro empresa)
      ├─ afip (default)     → Factura A/B/C → WSFE → CAE + QR
      ├─ cajero             → Cajero elige A/B/C o Ticket sin CAE
      └─ ticket_solo        → Solo ticket operativo (sin AFIP)

2. Emisión AFIP (si no es ticket)
      → solicitarCaeFactura / CAEA si contingencia
      → Factura en DB con CAE o pendiente_cae

3. Salida física (parámetro independiente)
      ├─ impresora térmica Hasar/Epson ESC/POS (TCP 9100 o USB agente)
      ├─ PDF A4 / 80mm navegador
      ├─ ambos
      └─ preguntar al cajero

4. Etiquetas góndola (aparte del comprobante)
      → POST /api/impresion/etiqueta { productoId | nombre+precio }
```

## Dónde se configura

| Qué | UI | API |
|-----|----|-----|
| Modo AFIP / cajero / ticket | Config → Emisión fiscal | `GET/PATCH /api/config/fiscal-emision` |
| Hasar/Epson IP | Config impresora | `POST /api/impresion/configurar-impresora` |
| Listar impresoras | — | `GET /api/impresion/impresoras` |
| Imprimir ticket factura | POS post-venta | `POST /api/impresion/imprimir-ticket` |
| Etiqueta góndola | Productos / API | `POST /api/impresion/etiqueta` |

### Parámetros clave (`ParametroFiscal`)

| Clave | Significado |
|-------|-------------|
| `fiscal_modo_comprobante` | 1=afip 2=cajero 3=ticket_solo |
| `fiscal_tipo_default_afip` | 0=auto 1=A 2=B 3=C |
| `fiscal_permitir_ticket_sin_afip` | 1 = permite ticket como fallback |
| `fiscal_salida_comprobante` | 1=impresora 2=pdf 3=ambos 4=preguntar |
| `fiscal_marca_impresora` | 0=ninguna 1=hasar 2=epson |
| `fiscal_imprimir_auto` | 1 = imprime al emitir |
| `fiscal_incluir_qr_ticket` | QR AFIP en ticket |
| `fiscal_etiqueta_ancho_mm` | 40 o 50 |

## Impresoras Hasar / Epson

- **Camino soportado:** térmica **ESC/POS** (ticket + etiqueta) por **red :9100** o USB vía `PRINTER_USB_AGENT_URL`.
- El **CAE lo da AFIP electrónico** (tu cert OpenSSL / WSAA / WSFE), no el protocolo de controlador fiscal de jornada Z.
- Marcas: `hasar` y `epson` en `ConfiguracionImpresora` + drivers en `lib/printer/hasar-printer.ts` y `epson-printer.ts`.
- Simulación dev: `PRINTER_SIMULATE=true`.

## Certificados (tu flujo TOTVS/OpenSSL)

1. Emitir cert AFIP del contribuyente (como en TOTVS).
2. Cargar en empresa (`certificadoCRT` / `certificadoKEY`) o env `AFIP_CERT_PROD` / `AFIP_KEY_PROD`.
3. `AFIP_ENTORNO=homologacion` hasta validar; luego `produccion`.
4. POS en modo **AFIP** → primera venta B/C/A con CAE.
5. Impresora térmica imprime el ticket **ya autorizado**.

## Código clave

| Pieza | Path |
|-------|------|
| Política cajero/AFIP | `lib/fiscal/pos-comprobante-policy.ts` |
| Config emisión | `lib/fiscal/emission-config.ts` |
| Venta + CAE | `app/api/pos/venta/route.ts` + `lib/afip/solicitar-cae-factura.ts` |
| Ticket ESC/POS | `lib/printer/ticket-builder.ts` |
| Etiqueta | `lib/printer/label-builder.ts` |
| UI config | `components/fiscal/fiscal-emision-config-panel.tsx` |
| POS selector | `app/dashboard/pos/page.tsx` |
