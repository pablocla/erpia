/**
 * API /hospitalidad/platos — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { GET, POST } from "@/app/api/hospitalidad/platos/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
  whereEmpresa: (empresaId: number, extra: Record<string, unknown> = {}) => ({
    ...extra,
    empresaId,
  }),
}))

const mockGetAuthContext = getAuthContext as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/hospitalidad/platos", () => {
  it("should return auth response when not authorized", async () => {
    mockGetAuthContext.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    })

    const res = await GET(new NextRequest("http://test.local/api/hospitalidad/platos"))
    expect(res.status).toBe(401)
  })

  it("should return platos with recetas", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 7 } })

    mockPrismaClient.producto.findMany.mockResolvedValue([
      { id: 1, codigo: "PLT-1", nombre: "Milanesa", precioVenta: 1500, porcentajeIva: 21, unidad: "porcion" },
    ])

    mockPrismaClient.listaMateriales.findMany.mockResolvedValue([
      {
        id: 11,
        productoId: 1,
        descripcion: "Receta base",
        componentes: [{ id: 99, productoId: 55, cantidad: 0.2, unidad: "kg" }],
      },
    ])

    const res = await GET(new NextRequest("http://test.local/api/hospitalidad/platos"))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data[0].producto.codigo).toBe("PLT-1")
    expect(data[0].receta.componentes.length).toBe(1)
  })
})

describe("POST /api/hospitalidad/platos", () => {
  it("should create plato with receta", async () => {
    mockGetAuthContext.mockResolvedValue({ ok: true, auth: { empresaId: 7 } })
    mockPrismaClient.producto.findFirst.mockResolvedValue(null)

    mockPrismaClient.producto.create.mockResolvedValue({
      id: 10,
      codigo: "PLT-10",
      nombre: "Pizza",
      precioVenta: 2000,
      porcentajeIva: 21,
      unidad: "porcion",
      categoria: null,
    })
    mockPrismaClient.listaMateriales.create.mockResolvedValue({
      id: 5,
      productoId: 10,
      componentes: [{ id: 1, productoId: 50, cantidad: 1, unidad: "unidad" }],
    })

    const body = {
      producto: {
        codigo: "PLT-10",
        nombre: "Pizza",
        precioVenta: 2000,
        porcentajeIva: 21,
        unidad: "porcion",
      },
      receta: {
        componentes: [{ productoId: 50, cantidad: 1, unidad: "unidad" }],
      },
    }

    const res = await POST(
      new NextRequest("http://test.local/api/hospitalidad/platos", {
        method: "POST",
        body: JSON.stringify(body),
      })
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.producto.codigo).toBe("PLT-10")
    expect(data.receta.componentes.length).toBe(1)
  })
})
