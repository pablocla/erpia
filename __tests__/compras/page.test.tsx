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

const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe("ComprasPage", () => {
  it("renders correctly", async () => {
    render(<ComprasPage />)
    expect(await screen.findByText("Compras")).toBeInTheDocument()
    expect(await screen.findByText("Órdenes de Compra")).toBeInTheDocument()
  })
})
