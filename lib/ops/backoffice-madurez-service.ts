/**
 * Panel de madurez backoffice vs ERP maduro (roadmap B0–B12).
 */

export type MadurezEstado = "ok" | "parcial" | "pendiente"

export interface MadurezItem {
  sprint: string
  proceso: string
  estado: MadurezEstado
  pct: number
  nota: string
}

export interface BackofficeMadurezResumen {
  areas: Record<string, number>
  items: MadurezItem[]
  ordenImplementacion: string[]
}

const ITEMS: MadurezItem[] = [
  { sprint: "IMP", proceso: "Circuito cheques + recibo/OP", estado: "ok", pct: 100, nota: "Jun 2026" },
  { sprint: "B0", proceso: "Estabilización fiscal / liquidaciones", estado: "parcial", pct: 85, nota: "CITI + checklist" },
  { sprint: "B1", proceso: "Integridad GL (cuentaContableId FK)", estado: "parcial", pct: 60, nota: "FK en movimientos nuevos" },
  { sprint: "B2", proceso: "Tesorería AR (multi-medio, conciliación)", estado: "parcial", pct: 75, nota: "Multi-medio + CSV conciliación" },
  { sprint: "B3", proceso: "Cierre período global", estado: "parcial", pct: 70, nota: "Stock + NC + cobros/pagos" },
  { sprint: "B4", proceso: "Costeo PPP + CMV real", estado: "parcial", pct: 65, nota: "PPP en compra, snapshot en venta" },
  { sprint: "B5", proceso: "Centros de costo cableados", estado: "parcial", pct: 70, nota: "Default en asientos auto" },
  { sprint: "B6", proceso: "Presupuesto vs ejecutado", estado: "parcial", pct: 55, nota: "Wire compra/CMV/OC" },
  { sprint: "B7", proceso: "Retenciones + certificados PDF", estado: "parcial", pct: 65, nota: "Auto-cálculo + cert PDF" },
  { sprint: "B8", proceso: "Reporting fiscal cerrado", estado: "parcial", pct: 80, nota: "Pack contador ZIP" },
  { sprint: "B9", proceso: "Cola contable offline/batch", estado: "pendiente", pct: 0, nota: "Sin modelo" },
  { sprint: "B10", proceso: "Multi-sucursal consolidación", estado: "pendiente", pct: 10, nota: "Sucursal en caja" },
  { sprint: "B11", proceso: "Costeo FIFO / OP industria", estado: "pendiente", pct: 5, nota: "Post B4" },
  { sprint: "B12", proceso: "e-cheq + endoso integrado", estado: "pendiente", pct: 0, nota: "UI próximamente" },
]

export function getBackofficeMadurez(): BackofficeMadurezResumen {
  const areas: Record<string, number> = {
    fiscal: 82,
    gl: 65,
    tesoreria: 78,
    costos: 52,
    offline: 0,
  }

  return {
    areas,
    items: ITEMS,
    ordenImplementacion: [
      "IMP (migración DB)",
      "B0 → B1 → B2 → B3 → B7 → B8",
      "B4 → B5 → B6",
      "B9 → B10 → B11 → B12",
    ],
  }
}