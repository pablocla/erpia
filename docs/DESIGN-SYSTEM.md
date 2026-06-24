# Sistema de Diseño Visual — ClavERP Argentina

Esta guía establece las directrices estéticas y los componentes comunes del ERP ClavERP para asegurar consistencia visual y un aspecto premium en todas las pantallas.

---

## 1. Estructura de Páginas (`PageShell` y `PageHeader`)

Cada módulo debe envolverse en un `PageShell` y usar un `PageHeader` en lugar de un `h1` aislado.

### Cuándo usar `PageHeader` vs. `Card` Title:
* **`PageHeader`**: Se usa una sola vez por ruta en la parte superior. Define el contexto del módulo, muestra estado/badges del módulo y contiene las acciones principales (CTAs como "Nueva Factura").
* **`Card` Title**: Se usa dentro del contenido para subdividir paneles de datos, secciones secundarias o bloques de formularios.

```tsx
import { PageShell, PageHeader } from "@/components/layout"

<PageShell>
  <PageHeader
    title="Notas de Crédito"
    description="Gestión y emisión de notas de crédito electrónicas."
    badge={<span className="badge-glow">AFIP Activo</span>}
    actions={<Button>Nueva NC</Button>}
    variant="surface" // Usa "surface" en módulos transaccionales
  />
  {/* Contenido */}
</PageShell>
```

---

## 2. Estados y Distintivos (`StatusBadge`)

**Regla de Oro**: Queda estrictamente prohibido hardcodear colores de estado (ej: `bg-green-100` o `text-red-800`). Deben usarse los tokens semánticos definidos mediante `StatusBadge` y `status-map.ts`. Esto garantiza el soporte nativo para **Modo Oscuro** y todas las paletas de colores.

### Variantes de `StatusBadge`:
* `success`: Operaciones completadas, aprobadas, facturadas o emitidas.
* `warning`: Pendientes, borradores, advertencias o estados intermedios.
* `error`: Rechazados por AFIP, anulados o fallidos.
* `info`: Confirmados, en proceso, enviados o en tránsito.
* `neutral`: Estados inactivos o valores base.

```tsx
import { StatusBadge } from "@/components/layout"
import { facturaEstadoVariant, facturaEstadoLabel } from "@/lib/ui/status-map"

<StatusBadge 
  variant={facturaEstadoVariant(factura.estado)} 
  label={facturaEstadoLabel(factura.estado)} 
  dot={true} 
/>
```

---

## 3. Ejemplo de Página tipo Listado Estándar

```tsx
"use client"

import { PageShell, PageHeader, PageToolbar, TableSkeleton } from "@/components/layout"
import { DataTable } from "@/components/data-table"

export default function ListadoPage() {
  const { data, isLoading } = useFetch("/api/datos")

  return (
    <PageShell>
      <PageHeader
        title="Clientes"
        description="Base de datos unificada de clientes y cuentas corrientes."
        actions={<Button>Crear Cliente</Button>}
      />

      <PageToolbar 
        left={<Input placeholder="Buscar por CUIT o Razón Social..." />}
        right={<Button variant="outline">Exportar Excel</Button>}
      />

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </PageShell>
  )
}
```

---

## 4. Densidad y Espaciado

* Usar `space-y-6` en los contenedores principales de layouts.
* Usar `gap-3` o `gap-4` en barras de herramientas (`PageToolbar`).
* Toda acción principal debe estar alineada a la derecha del `PageHeader` o de la `PageToolbar`.

---

## 5. Catálogo de Dominios en `status-map.ts`

Al agregar estados, use el método correspondiente para obtener la variante y etiqueta traducida:
* **Leads (CRM)**: `leadEstadoVariant` / `leadEstadoLabel`
* **Mesas (Hospitalidad)**: `mesaEstadoVariant` / `mesaEstadoLabel`
* **Sensores (IoT)**: `iotNivelVariant` / `iotNivelLabel` e `iotCalidadVariant` / `iotCalidadLabel`
* **Transacciones (TES)**: `tesTipoVariant` / `tesTipoLabel`
* **Contabilidad**: `tipoCuentaVariant` / `tipoCuentaLabel` y `periodoFiscalVariant` / `periodoFiscalLabel`
* **Activos Fijos**: `activoFijoEstadoVariant` / `activoFijoEstadoLabel`
* **Auditoría**: `auditoriaAccionVariant` / `auditoriaAccionLabel`
* **Turnos**: `turnoEstadoVariant` / `turnoEstadoLabel`
* **Cheques**: `chequeEstadoVariant` / `chequeEstadoLabel`
* **Caja**: `cajaEstadoVariant` / `cajaEstadoLabel`
* **Tickets/Soporte**: `ticketEstadoVariant` / `ticketEstadoLabel`
* **Activo/Inactivo**: `activoVariant` / `activoLabel`
