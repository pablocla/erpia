// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ComprasPage from "@/app/dashboard/compras/page"

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [], total: 0 }),
  })
) as unknown as typeof fetch

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe("ComprasPage", () => {
  it("renders correctly", () => {
    render(<ComprasPage />)
    expect(screen.getByText("Compras")).toBeInTheDocument()
    expect(screen.getAllByText(/Órdenes de compra/i)[0]).toBeInTheDocument()
  })
})
