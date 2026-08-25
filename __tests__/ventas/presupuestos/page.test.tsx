// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import PresupuestosPage from "@/app/dashboard/ventas/presupuestos/page"

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
  })
) as unknown as typeof fetch

describe("PresupuestosPage", () => {
  it("renders correctly", async () => {
    render(<PresupuestosPage />)
    expect(await screen.findByText("Presupuestos")).toBeInTheDocument()
    expect(await screen.findByText(/Armá ofertas/i)).toBeInTheDocument()
  })
})
