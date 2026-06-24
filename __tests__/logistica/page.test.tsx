// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import LogisticaPage from "@/app/dashboard/logistica/page"

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as unknown as typeof fetch

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe("LogisticaPage", () => {
  it("renders correctly", () => {
    render(<LogisticaPage />)
    expect(screen.getByText("Logística")).toBeInTheDocument()
    expect(screen.getByText("Gestión de envíos, transportistas y rutas")).toBeInTheDocument()
  })
})
