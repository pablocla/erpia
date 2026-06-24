// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ContratosPage from "@/app/dashboard/agro/contratos/page"

vi.mock("@/hooks/use-auth-fetch", () => ({
  useAuthFetch: () => ({
    data: { contratos: [], total: 0, pages: 0 },
    isLoading: false,
  }),
}))

describe("ContratosPage", () => {
  it("renders correctly", () => {
    render(<ContratosPage />)
    expect(screen.getByText("Contratos")).toBeInTheDocument()
    expect(screen.getByText(/Contratos de compra\/venta de cereales/i)).toBeInTheDocument()
  })
})
