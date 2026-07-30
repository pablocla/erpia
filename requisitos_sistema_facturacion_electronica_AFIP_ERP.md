# Requisitos Completos – Sistema de Facturación Electrónica AFIP/ARCA
## Checklist de Validación para ERP (Nacional + Exportación + FCE MiPyME + Puntos de Venta + Bono Fiscal PyME)

**Objetivo de este documento:**  
Servir como **prompt de validación exhaustiva** para que un sistema (Grok Build / auditor de código / QA) verifique que el ERP cumple **todos** los requisitos técnicos, funcionales y normativos de facturación electrónica en Argentina.  
Debe validar generación de XML, envío a Web Services, respuestas, almacenamiento, QR, leyendas, puntos de venta y regímenes especiales (incluyendo Factura de Crédito Electrónica MiPyME y aspectos relacionados a beneficios fiscales PyME).

**Normas principales de referencia (no exhaustivo):**
- RG 1415/03 y modificatorias (régimen general de comprobantes)
- RG 2485/08 y modificatorias (facturación electrónica)
- RG 2904, 3749, 4291, 4367/18 (FCE MiPyME), 4892 (QR), etc.
- Régimen de Transparencia Fiscal al Consumidor (Ley 27.743 y normas ARCA)
- Manuales de desarrollador WSFE / WSFEX / WSFEcred (AFIP/ARCA)
- Esquemas XSD oficiales de los Web Services

---

## 1. Autenticación y Seguridad (WSAA)

- [ ] Soporte completo de **WSAA** (Web Service de Autenticación y Autorización).
- [ ] Generación y uso de **Ticket de Acceso (TA)** con Token y Sign.
- [ ] Manejo de certificados digitales (PKCS#12 / .p12 / .pfx) asociados al CUIT.
- [ ] Distinción clara entre ambiente de **Homologación** y **Producción**.
- [ ] Renovación automática o alerta de vencimiento de certificado y de TA (válido ~12-24 hs).
- [ ] Almacenamiento seguro de certificados y claves privadas (nunca en texto plano).
- [ ] Soporte de múltiples CUITs / empresas (multi-empresa).

## 2. Gestión de Puntos de Venta (PV)

- [ ] Alta, baja y consulta de **Puntos de Venta** a través de los Web Services correspondientes o Padrones AFIP.
- [ ] Asociación correcta de cada PV al tipo de emisión (electrónica, controlador fiscal, etc.).
- [ ] Control de numeración correlativa y única por PV + Tipo de Comprobante + Letra.
- [ ] Validación de que el PV esté autorizado y vigente antes de solicitar CAE.
- [ ] Manejo de PV para Factura Electrónica Nacional, Exportación y FCE.
- [ ] Soporte de PV de contingencia / CAEA.
- [ ] Visualización y auditoría del estado de cada PV (activo, baja, pendiente).

## 3. Tipos de Comprobantes Soportados

El sistema **debe** poder emitir y gestionar al menos:

### 3.1 Nacional (WSFE)
- Factura A, B, C, M
- Nota de Débito A, B, C, M
- Nota de Crédito A, B, C, M
- Factura de Crédito Electrónica MiPyME (FCE A, B, C) – ver sección específica
- Otros comprobantes habilitados según actividad (tique factura electrónico si aplica, etc.)

### 3.2 Exportación (WSFEX)
- Factura E
- Nota de Débito E
- Nota de Crédito E
- Facturas de exportación con todos los campos específicos (ver sección 5)

### 3.3 Otros / Especiales
- Comprobantes con leyenda de “Operación sujeta a retención”
- Comprobantes observados / con observaciones AFIP
- Soporte de CAEA (Código de Autorización Electrónico Anticipado) para contingencia

## 4. Facturación Electrónica Nacional – WSFE

### 4.1 Solicitud de CAE / CAEA
- [ ] Armado correcto del request `FECAESolicitar` / `FECAEASolicitar`.
- [ ] Envío de **todos** los campos obligatorios según tipo de comprobante y receptor.
- [ ] Manejo de respuestas: CAE, Vencimiento CAE, Resultado (A/R/P), Observaciones, Errores.
- [ ] Reintento controlado y logging de errores AFIP (códigos de error oficiales).
- [ ] Validación previa local de datos antes de enviar (CUIT receptor, importes, alícuotas, etc.).

### 4.2 Datos del Comprobante (mínimos obligatorios)
- Fecha del comprobante
- Tipo y Letra de comprobante
- Punto de Venta + Número
- Concepto (Productos / Servicios / Productos y Servicios)
- Condición frente al IVA del emisor y del receptor
- Tipo de documento y Nro. de documento del receptor (CUIT/CUIL/DNI/CF/etc.)
- Importes: Neto Gravado, Exento, No Gravado, IVA por alícuota, Tributos, Total
- Alícuotas de IVA (0%, 10.5%, 21%, 27%, etc.) correctamente discriminadas
- Fecha de servicio / período (cuando aplica Concepto Servicios)
- Moneda y cotización (si no es pesos)
- Opcionales: Comprador del Exterior, Impuestos Internos, Percepciones, etc.

### 4.3 IVA y Leyendas (Transparencia Fiscal + RG 1415)
- [ ] Discriminación correcta de IVA en Facturas A (siempre) y en B/C según régimen vigente de Transparencia Fiscal.
- [ ] Inclusión de la leyenda de Transparencia Fiscal al Consumidor cuando corresponda (Ley 27.743).
- [ ] Leyenda clásica: **“El monto del IVA discriminado no puede computarse como crédito fiscal”** cuando aplica (RG 1415 / referencias en 2485).
- [ ] Otras leyendas obligatorias según caso (Monotributo, Exento, etc.).

## 5. Facturación de Exportación – WSFEX

- [ ] Uso exclusivo del Web Service **WSFEX**.
- [ ] Campos específicos obligatorios / condicionales:
  - Tipo de exportación (1=Bienes, 2=Servicios, 4=Otros)
  - Permiso de embarque (cuando corresponde)
  - País de destino (código AFIP)
  - Incoterms (FOB, CIF, etc.)
  - Idioma del comprobante
  - Moneda y tipo de cambio
  - CUIT del país / ID impositivo del receptor en el exterior
  - Domicilio completo del cliente exterior
  - Datos de transporte / buque / vuelo (si aplica)
  - Observaciones de exportación
- [ ] Cálculo correcto de base imponible y tratamiento de IVA (generalmente exento o no alcanzado según operación).
- [ ] Generación de XML conforme al XSD de WSFEX.
- [ ] Manejo de respuestas CAE de exportación y observaciones específicas.

## 6. Factura de Crédito Electrónica MiPyME (FCE) – RG 4367 y modificatorias

**Este es el régimen clave relacionado a “Bono Fiscal / financiamiento PyME”.**

- [ ] Detección automática de cuando corresponde emitir FCE (emisor MiPyME + receptor Gran Empresa o adherido + monto ≥ umbral vigente).
- [ ] Emisión de **Factura de Crédito Electrónica MiPyME** (códigos de tipo de comprobante específicos: 201, 206, 211, etc. según letra).
- [ ] Campos adicionales de FCE:
  - CBU del emisor (obligatorio)
  - Fecha de vencimiento de pago / plazo
  - Referencia a la operación / orden de compra si aplica
  - Indicador de FCE
- [ ] Integración con el **Registro de Facturas de Crédito Electrónicas MiPyME**.
- [ ] Flujo completo de aceptación / rechazo / cancelación por parte del comprador.
- [ ] Notificaciones y consulta de estado de la FCE.
- [ ] Soporte de cesión / descuento de FCE (si el ERP lo contempla).
- [ ] Validación de que el emisor tenga Domicilio Fiscal Electrónico constituido y CBU registrada.

> **Nota sobre “Bono Fiscal PyME”:**  
> El sistema debe poder identificar y gestionar los comprobantes que habilitan o se relacionan con beneficios fiscales PyME (FCE como instrumento de financiamiento y eventuales bonos de crédito fiscal que ARCA asigne). Debe permitir reportes y trazabilidad de estos comprobantes.

## 7. Generación y Validación de XML

- [ ] Generación de XML **estrictamente conforme** a los XSD oficiales publicados por AFIP/ARCA para:
  - WSFE (FECAERequest, etc.)
  - WSFEX
  - WSFEcred / FCE
  - WSAA
- [ ] Validación local del XML contra el XSD **antes** de enviar.
- [ ] Escapado correcto de caracteres especiales (UTF-8).
- [ ] Namespaces correctos.
- [ ] Orden de elementos según schema (importante en AFIP).
- [ ] Manejo de decimales con la precisión exigida (generalmente 2 decimales para importes).
- [ ] Logging completo del XML request y response para auditoría.

## 8. Código QR (RG 4892 y relacionadas)

- [ ] Generación del código QR obligatorio en los comprobantes electrónicos.
- [ ] Contenido del QR según especificación oficial (incluye CAE, fecha, importe, CUIT, etc.).
- [ ] Posicionamiento y tamaño legible en PDF / representación impresa.
- [ ] Validación de que el QR se pueda leer y apunte a la URL oficial de AFIP/ARCA.

## 9. Representación Impresa / PDF

- [ ] Generación de PDF o representación gráfica que cumpla RG 1415 (datos obligatorios, leyendas, CAE, vencimiento CAE, QR).
- [ ] Inclusión de todos los datos del emisor, receptor, detalle de items, impuestos, totales.
- [ ] Leyendas de Transparencia Fiscal y de IVA no computable cuando corresponda.
- [ ] Numeración visible y datos de autorización (CAE + F. Vto.).

## 10. Contingencia y CAEA

- [ ] Solicitud y administración de **CAEA** (lotes anticipados).
- [ ] Emisión en modo contingencia cuando el Web Service no está disponible.
- [ ] Posterior información de los comprobantes emitidos con CAEA.
- [ ] Control de no superar los rangos autorizados de CAEA.

## 11. Almacenamiento, Auditoría y Cumplimiento

- [ ] Almacenamiento electrónico de los comprobantes autorizados por el plazo legal (mínimo 10 años o el que fije la normativa vigente).
- [ ] Conservación del XML original de request/response + CAE.
- [ ] Trazabilidad completa: quién emitió, cuándo, desde qué IP/usuario, XML enviado, respuesta AFIP.
- [ ] Consulta de comprobantes emitidos (FECompConsultar / equivalentes).
- [ ] Reportes de control (diferencias de numeración, rechazos, observaciones frecuentes).
- [ ] Backup y recuperación de la información fiscal.

## 12. Validaciones de Negocio Previas al Envío

- [ ] CUIT/CUIL del receptor válido y consistente con padrón (cuando se consulte).
- [ ] Condición de IVA del receptor coherente con el tipo de factura (A vs B vs C).
- [ ] Importes que cierren matemáticamente (Neto + IVA + Tributos = Total).
- [ ] Alícuotas permitidas según actividad y tipo de operación.
- [ ] Fechas coherentes (no futuras indebidas, período de servicio, etc.).
- [ ] Moneda y cotización obligatoria cuando no es ARS.
- [ ] Validación de umbrales para FCE MiPyME.

## 13. Manejo de Errores y Observaciones AFIP

- [ ] Interpretación de todos los códigos de error y observación oficiales.
- [ ] Mensajes claros al usuario (no solo el código técnico).
- [ ] Posibilidad de corregir y reenviar cuando el error lo permite.
- [ ] Registro de comprobantes rechazados vs observados vs aprobados.
- [ ] Tratamiento especial de observaciones que no impiden la autorización pero deben informarse.

## 14. Multi-empresa / Multi-CUIT / Multi-PV

- [ ] Soporte de varias empresas (varios certificados).
- [ ] Cambio de contexto de CUIT sin reiniciar el sistema.
- [ ] Aislamiento de numeración y CAE por empresa + PV.

## 15. Ambientes y Testing

- [ ] Configuración clara Homologación vs Producción.
- [ ] Posibilidad de emitir en homologación con datos de prueba.
- [ ] Suite de pruebas automatizadas recomendada (casos de factura A, B, C, E, FCE, NC, ND, errores comunes, etc.).

## 16. Integración con el resto del ERP

- [ ] El módulo de facturación debe alimentarse correctamente desde:
  - Clientes (condición IVA, documento, domicilio)
  - Artículos / Servicios (alícuota IVA, tipo de concepto)
  - Pedidos / Remitos / Contratos
  - Stock y contabilidad (asientos automáticos)
- [ ] Generación de asiento contable coherente con la factura autorizada.
- [ ] Actualización de cuenta corriente del cliente solo después de CAE aprobado (o según política de la empresa).

## 17. Puntos Específicos de Validación de XML (para el auditor de código)

El validador debe verificar que el ERP genera XML que:

1. Pasa validación XSD oficial sin errores.
2. Contiene **todos** los nodos obligatorios según el tipo de comprobante.
3. Los importes tienen la cantidad de decimales correcta.
4. Los códigos de tipo de comprobante, documento, moneda, país, etc. son los oficiales de AFIP.
5. El nodo de autenticación (Token/Sign) es válido al momento del envío.
6. En FCE se incluyen los campos extra (CBU, etc.).
7. En Exportación se incluyen Incoterm, País, Tipo de Exportación, etc.
8. Las alícuotas de IVA están correctamente tipificadas (Id = 3 → 0%, 4 → 10.5%, 5 → 21%, 6 → 27%, etc.).

---

## Checklist Rápido de Cobertura del Sistema

| Módulo / Régimen                  | Obligatorio | Estado de implementación (a completar) |
|-----------------------------------|-------------|----------------------------------------|
| WSAA + Certificados               | Sí          |                                        |
| Puntos de Venta                   | Sí          |                                        |
| WSFE (Nacional A/B/C/M)           | Sí          |                                        |
| WSFEX (Exportación E)             | Sí          |                                        |
| FCE MiPyME (RG 4367)              | Sí (PyME)   |                                        |
| CAE + CAEA                        | Sí          |                                        |
| QR Code                           | Sí          |                                        |
| Discriminación IVA + Leyendas     | Sí          |                                        |
| Transparencia Fiscal (Ley 27.743) | Sí          |                                        |
| Almacenamiento + Auditoría        | Sí          |                                        |
| Contingencia                      | Recomendado |                                        |
| Validación XSD previa             | Muy recomendado |                                    |

---

## Instrucciones de uso de este documento como Prompt

Copiá y pegá este Markdown completo (o las secciones relevantes) en el prompt dirigido a Grok Build / auditor de código, agregando:

> “Analizá el código del módulo de facturación electrónica de este ERP y validá punto por punto contra este checklist. Indicá para cada ítem:  
> - Cumple / No cumple / Parcial  
> - Evidencia en el código (archivos, clases, métodos)  
> - Riesgos de no cumplimiento normativo  
> - Recomendaciones de corrección.  
> Prestá especial atención a la generación de XML, manejo de FCE MiPyME, WSFEX, puntos de venta y leyendas de IVA.”

---

**Fin del documento de requisitos.**  
Actualizar este archivo cada vez que ARCA publique cambios relevantes en Web Services, XSD o nuevas resoluciones generales.
