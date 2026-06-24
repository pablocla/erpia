// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import InventarioPage from "@/app/dashboard/productos/inventario/page"

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      items: [],
      resumen: { totalProductos: 0, stockTotal: 0, alertasStockBajo: 0 }
    }),
  })
) as unknown as typeof fetch

describe("InventarioPage", () => {
  it("renders correctly", () => {
    render(<InventarioPage />)
    expect(screen.getByText("Inventario")).toBeInTheDocument()
    expect(screen.getByText(/Visión general de stock/i)).toBeInTheDocument()
  })
})
