# Dossier de Implementación — [RAZÓN SOCIAL]

> Plantilla CCA-020 | Copiar a `docs/clientes/<empresaId>/DOSSIER.md` al iniciar proyecto  
> Última actualización: YYYY-MM-DD

---

## 1. Identificación del cliente

| Campo | Valor |
|-------|-------|
| **empresaId** | |
| **Razón social** | |
| **Nombre fantasía** | |
| **CUIT** | |
| **Rubro** | |
| **Plan comercial** | Starter / Pro / Enterprise |
| **planHosting** | shared / dedicated |
| **Condición IVA** | RI / Monotributista |
| **Jurisdicción IIBB** | |
| **Fecha contrato** | |
| **Fecha objetivo go-live** | |
| **Analista asignado** | |
| **Rol analista** | lead / soporte / implementacion / dba |

---

## 2. Contactos

| Rol | Nombre | Email | Teléfono |
|-----|--------|-------|----------|
| Decisor / dueño | | | |
| Referente operativo | | | |
| Contador externo | | | |
| Soporte IT cliente | | | |

---

## 3. Alcance comercial (CCA-010)

### SKUs contratados

| SKU | Producto | Vigencia desde | Límite eventos/mes |
|-----|----------|----------------|-------------------|
| core.clavis | | | |
| | | | |

### Módulos / features incluidos

| Feature key | Activado | Notas |
|-------------|----------|-------|
| pos | ☐ | |
| facturacion_afip | ☐ | |
| stock | ☐ | |
| contabilidad | ☐ | |
| | | |

### Fuera de alcance (IN/OUT)

**Incluido:**
- 

**Excluido:**
- 

---

## 4. Pack ONBOARD entregado (CCA-030)

> Completar al finalizar aprovisionamiento. Equivalente aba ONBOARD TCloud.

| Ítem | Valor | Fecha entrega |
|------|-------|---------------|
| URL producción (`prd`) | | |
| URL validación (`val`) | | |
| URL portal B2B | | |
| URL tienda online | | |
| Usuario admin inicial | | |
| Contraseña temporal (no guardar aquí — referencia) | Reset en primer login | |
| Entorno AFIP inicial | homologacion | |
| Centro de Operaciones | /dashboard/operaciones | |
| Versión deployada | | |
| Healthcheck OK | ☐ | |

### Entornos técnicos (`TenantEntorno`)

| Código | urlBase | dbNombre | estado | versión |
|--------|---------|----------|--------|---------|
| dev | | claverp_{id}_dev | | |
| val | | claverp_{id}_val | | |
| prd | | claverp_{id}_prd | | |

---

## 5. Matriz de requerimientos

| ID | Requerimiento | Módulo | Prioridad | Estado | Ticket |
|----|---------------|--------|-----------|--------|--------|
| R001 | | | Alta | Pendiente | |
| R002 | | | Media | | |

---

## 6. Parametrización (CCA-040)

### Fiscal

| Ítem | Valor | OK |
|------|-------|-----|
| Puntos de venta AFIP | | ☐ |
| Certificado homologación cargado | | ☐ |
| Certificado producción cargado | | ☐ |
| CAEA configurado | | ☐ |
| Percepciones IIBB | | ☐ |

### Maestros cargados

| Maestro | Cantidad | Método | Fecha | OK |
|---------|----------|--------|-------|-----|
| Productos | | CSV | | ☐ |
| Clientes | | | | ☐ |
| Proveedores | | | | ☐ |
| Plan de cuentas | | Seed rubro | | ☐ |

### Personalización (capas 2-4)

| Tipo | Detalle |
|------|---------|
| Campos personalizados | |
| Tablas auxiliares | |
| Workflows activos | |

---

## 7. Integraciones (CCA-050)

| Canal | Estado | Fecha test | Responsable | Notas |
|-------|--------|------------|-------------|-------|
| AFIP | | | | |
| Mercado Pago | | | | |
| Mercado Libre | | | | |
| WhatsApp | | | | |
| Ecommerce externo | | | | |
| Logística | | | | |
| n8n Automation | | | | |

> **Seguridad ISO 27001:** no registrar tokens ni claves en este archivo. Usar referencia "vault / BD empresaId X".

---

## 8. UAT (CCA-060)

### Sesiones de capacitación

| Fecha | Rol | Participantes | Duración |
|-------|-----|---------------|----------|
| | Cajero | | |
| | Administración | | |

### Resultado UAT

| Escenario | OK | Observación |
|-----------|-----|-------------|
| Venta POS + CAE homologación | ☐ | |
| Nota de crédito | ☐ | |
| Cierre de caja | ☐ | |
| Compra / stock | ☐ | |
| Reporte IVA | ☐ | |

### Acta UAT

- **Fecha:** 
- **Ambiente:** val / homologación
- **Aprobación go-live:** ☐ Sí  ☐ No  ☐ Condicionada
- **Condiciones:** 
- **Firma cliente:** 
- **Firma analista:** 

---

## 9. Go-Live (CCA-070)

| Hito | Fecha / Hora | Responsable | OK |
|------|--------------|-------------|-----|
| Backup pre go-live | | | ☐ |
| Switch AFIP producción | | | ☐ |
| Primera venta real | | | ☐ |
| Cierre primer día | | | ☐ |
| Incidentes P0 | Ninguno / Ver tickets | | ☐ |

### Plan de rollback (si aplica)

1. 
2. 

---

## 10. Cierre e hipercare (CCA-080)

| Período | Incidentes | Resueltos | Pendientes |
|---------|------------|-----------|------------|
| Día 1-7 | | | |
| Día 8-15 | | | |
| Día 16-30 | | | |

- **Acta de cierre:** Fecha _____ Firmada: ☐
- **NPS / CSAT:** 
- **Handoff soporte N1:** Fecha _____

---

## 11. Historial de cambios del dossier

| Fecha | Autor | Cambio |
|-------|-------|--------|
| | | Creación dossier |