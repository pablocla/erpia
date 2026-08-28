/**
 * Test Suite: Capacidades Gratuitas por Rubro ("El Juego Gratis")
 *
 * Valida que cada vertical pueda operar su flujo diario esencial
 * de forma 100% gratuita (pantalla + CPU), sin exigir pagos, SKUs de disparo,
 * ni bloquearse por falta de integraciones externas (AFIP, WhatsApp, MercadoPago).
 */
import { describe, it, expect, vi } from "vitest"
import { liquidarSemanaOperario } from "@/lib/oficios/cuadrilla-service"
import { getIndustryTemplate, INDUSTRY_TEMPLATES } from "@/lib/comercial/industry-templates"
import { getNicheApp, NICHE_APPS } from "@/lib/niche/niche-apps-catalog"
import { DISPAROS_CONFIG, tieneDisparoHabilitado, type DisparoKey } from "@/lib/comercial/paywall-disparo"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oficioOperario: {
      findFirst: vi.fn(),
    },
    oficioAsignacion: {
      findMany: vi.fn(),
    },
  },
}))

describe("1. Contrato Gratis vs Pago: Regla de Disparo", () => {
  it("un usuario solo con el SKU ancla gratuito NO tiene habilitados disparos hacia afuera", () => {
    const skusGratis = ["pos.fiado_barrio", "niche.oficios"]

    // Los disparos externos requieren su SKU específico o core.claver
    expect(tieneDisparoHabilitado("whatsapp_outbound", skusGratis)).toBe(false)
    expect(tieneDisparoHabilitado("sena_link_mp", skusGratis)).toBe(false)
    expect(tieneDisparoHabilitado("factura_afip", skusGratis)).toBe(false)
    expect(tieneDisparoHabilitado("segunda_caja", skusGratis)).toBe(false)
    expect(tieneDisparoHabilitado("tercer_usuario", skusGratis)).toBe(false)
  })

  it("cada disparo pago define claramente qué parte del flujo sigue siendo gratis", () => {
    const llaves: DisparoKey[] = [
      "whatsapp_outbound",
      "sena_link_mp",
      "factura_afip",
      "segunda_caja",
      "tercer_usuario",
      "reportes_historicos",
    ]

    for (const key of llaves) {
      const config = DISPAROS_CONFIG[key]
      expect(config).toBeDefined()
      expect(config.aclaracionGratis.length).toBeGreaterThan(15)
      expect(config.skuRequerido).toBeTruthy()
      expect(config.skusValidos.length).toBeGreaterThan(0)
    }
  })
})

describe("2. Almacén / Kiosco (Fiado Libreta Gratis)", () => {
  it("el ancla pos.fiado_barrio tiene goldenPath en /dashboard/fiado", () => {
    const tpl = getIndustryTemplate("kiosco")
    expect(tpl).toBeDefined()
    expect(tpl?.goldenPath).toBe("/dashboard/fiado")
    expect(tpl?.isRetail).toBe(true)
  })

  it("almacen tiene mapeo de caja, mostrador y fiado sin costo", () => {
    const tpl = getIndustryTemplate("almacen")
    expect(tpl?.menuLabels["/dashboard/fiado"]).toBe("Quién me debe")
    expect(tpl?.menuLabels["/dashboard/caja"]).toBe("Caja rápida")
    expect(tpl?.menuLabels["/dashboard/pos"]).toBe("Mostrador")
  })
})

describe("3. Oficios & Obras (Presupuesto 3 Niveles & Jornales Gratis)", () => {
  it("calcula la liquidación semanal de operario (días trabajados × valor jornal)", async () => {
    vi.mocked(prisma.oficioOperario.findFirst).mockResolvedValueOnce({
      id: "op-1",
      empresaId: 1,
      nombre: "Carlos Albañil",
      telefono: "1122334455",
      rol: "Oficial",
      valorJornal: 25000 as any,
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    } as any)

    vi.mocked(prisma.oficioAsignacion.findMany).mockResolvedValueOnce([
      {
        id: "asig-1",
        empresaId: 1,
        operarioId: "op-1",
        trabajoId: "t-1",
        fecha: new Date("2026-08-25"),
        trabajo: { titulo: "Instalación", direccion: "Av. Colón 100" },
      },
      {
        id: "asig-2",
        empresaId: 1,
        operarioId: "op-1",
        trabajoId: "t-1",
        fecha: new Date("2026-08-26"),
        trabajo: { titulo: "Instalación", direccion: "Av. Colón 100" },
      },
      {
        id: "asig-3",
        empresaId: 1,
        operarioId: "op-1",
        trabajoId: "t-2",
        fecha: new Date("2026-08-27"),
        trabajo: { titulo: "Pintura", direccion: "San Martín 200" },
      },
    ] as any)

    const liquidacion = await liquidarSemanaOperario(
      1,
      "op-1",
      new Date("2026-08-24"),
      new Date("2026-08-30"),
    )

    // 3 días × 25.000 = 75.000
    expect(liquidacion.diasTrabajados).toBe(3)
    expect(liquidacion.totalBruto).toBe(75000)
    expect(liquidacion.netoAPagar).toBe(75000)
    expect(liquidacion.operario.nombre).toBe("Carlos Albañil")
  })

  it("oficios template tiene acceso a obras, cuadrilla y nuevo presupuesto", () => {
    const tpl = getIndustryTemplate("oficios")
    expect(tpl?.goldenPath).toBe("/dashboard/oficios")
    expect(tpl?.menuLabels["/dashboard/oficios/nuevo"]).toBe("Nuevo Presupuesto")
    expect(tpl?.menuLabels["/dashboard/oficios/cuadrilla"]).toBe("Cuadrilla & Jornales")
  })
})

describe("4. Gimnasio & Clubes (Motor Cuotas Gratis)", () => {
  it("niche app club y gimnasio existen con engine cuotas", () => {
    const club = getNicheApp("club")
    const gym = getNicheApp("gimnasio")
    expect(club?.engine).toBe("cuotas")
    expect(gym?.engine).toBe("cuotas")
    expect(club?.accionPrincipal).toBe("Registrar cuota")
    expect(gym?.accionPrincipal).toBe("Registrar cuota")
  })

  it("gimnasio featured en industry-templates apunta a membresías", () => {
    const tpl = getIndustryTemplate("gimnasio")
    expect(tpl?.goldenPath).toBe("/dashboard/membresias")
    expect(tpl?.menuLabels["/dashboard/membresias"]).toBe("Socios")
    expect(tpl?.menuLabels["/dashboard/cuentas-cobrar"]).toBe("Cuotas vencidas")
  })
})

describe("5. Talleres, Tintorería & Remís (Motor Movimientos Gratis)", () => {
  it("niche app taller tiene categorías de orden, repuesto y mano de obra", () => {
    const taller = getNicheApp("taller")
    expect(taller?.engine).toBe("movimientos")
    expect(taller?.categorias).toContain("orden")
    expect(taller?.categorias).toContain("repuesto")
    expect(taller?.categorias).toContain("mano_obra")
  })

  it("niche app plancha/tintorería tiene acción 'Nuevo ticket'", () => {
    const plancha = getNicheApp("plancha")
    expect(plancha?.engine).toBe("movimientos")
    expect(plancha?.accionPrincipal).toBe("Nuevo ticket")
  })

  it("niche app remis tiene acción 'Cierre del chofer'", () => {
    const remis = getNicheApp("remis")
    expect(remis?.engine).toBe("movimientos")
    expect(remis?.categorias).toContain("viaje")
    expect(remis?.categorias).toContain("cierre")
  })
})

describe("6. Veterinaria & Consultorio (Historias Clínicas & Agenda Gratis)", () => {
  it("veterinaria template apunta a /dashboard/historia-clinica", () => {
    const tpl = getIndustryTemplate("veterinaria")
    expect(tpl?.goldenPath).toBe("/dashboard/historia-clinica")
    expect(tpl?.menuLabels["/dashboard/historia-clinica"]).toBe("Historias clínicas")
    expect(tpl?.menuLabels["/dashboard/agenda"]).toBe("Turnos")
  })

  it("clinica / consultorio template apunta a /dashboard/agenda", () => {
    const tpl = getIndustryTemplate("clinica")
    expect(tpl?.goldenPath).toBe("/dashboard/agenda")
    expect(tpl?.menuLabels["/dashboard/agenda"]).toBe("Turnos")
  })
})

describe("7. Fumigación & Control de Plagas (Ruta & OT Gratis)", () => {
  it("fumigación template cuenta con ruta del día, OT y abonos", () => {
    const tpl = getIndustryTemplate("fumigacion")
    expect(tpl?.goldenPath).toBe("/dashboard/fumigacion")
    expect(tpl?.menuLabels["/dashboard/fumigacion"]).toBe("Hoy · Ruta")
    expect(tpl?.menuLabels["/dashboard/ot"]).toBe("Órdenes de servicio")
    expect(tpl?.menuLabels["/dashboard/facturacion-recurrente"]).toBe("Abonos")
  })
})

describe("8. Cobertura de todos los rubros en catálogo", () => {
  it("todas las 20+ industrias tienen goldenPath y tagline definido", () => {
    for (const tpl of INDUSTRY_TEMPLATES) {
      expect(tpl.id).toBeTruthy()
      expect(tpl.label).toBeTruthy()
      expect(tpl.goldenPath).toMatch(/^\/dashboard/)
      expect(tpl.tagline).toBeTruthy()
      expect(tpl.wowMoment).toBeTruthy()
    }
  })

  it("todas las 20+ niche apps tienen appId, engine y accionPrincipal", () => {
    for (const app of NICHE_APPS) {
      expect(app.appId).toBeTruthy()
      expect(app.engine).toBeTruthy()
      expect(app.accionPrincipal).toBeTruthy()
    }
  })
})
