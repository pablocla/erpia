import { describe, it, expect } from "vitest"
import { getClienteRequiredFields, getProveedorRequiredFields, evaluateClienteCompleteness, evaluateProveedorCompleteness } from "../../lib/maestros/data-quality-profiles"

describe("Data Quality Profiles", () => {
  describe("Clientes", () => {
    it("fiado exige telefono y limiteCredito", () => {
      const ctx = { modoLite: "fiado", rubro: "kiosco" }
      const reqs = getClienteRequiredFields(ctx)
      expect(reqs.find(r => r.field === "telefono")?.severity).toBe("required")
      expect(reqs.find(r => r.field === "limiteCredito")?.severity).toBe("required")
    })

    it("pos exige nombre como required, y telefono/cuit como recommended", () => {
      const ctx = { modoLite: "pos", rubro: "kiosco" }
      const reqs = getClienteRequiredFields(ctx)
      expect(reqs.find(r => r.field === "nombre")?.severity).toBe("required")
      expect(reqs.find(r => r.field === "telefono")?.severity).toBe("recommended")
      expect(reqs.find(r => r.field === "cuit")?.severity).toBe("recommended")
    })

    it("score baja si faltan required o recommended", () => {
      const ctx = { modoLite: "fiado", rubro: "kiosco" }
      const clienteIncompleto = { nombre: "Juan" } // Falta telefono, limiteCredito, etc.
      
      const result = evaluateClienteCompleteness(clienteIncompleto, ctx)
      expect(result.ok).toBe(false)
      expect(result.missingRequired.length).toBeGreaterThan(0)
      expect(result.score).toBeLessThan(100)
    })
    
    it("score 100 y ok true si tiene todo", () => {
      const ctx = { modoLite: "fiado", rubro: "kiosco" }
      const clienteCompleto = { 
        nombre: "Juan", 
        telefono: "123", 
        fiadoHabilitado: true, 
        limiteCredito: 1000, 
        emailNotificacionFiado: "j@j.com" 
      }
      
      const result = evaluateClienteCompleteness(clienteCompleto, ctx)
      expect(result.ok).toBe(true)
      expect(result.missingRequired.length).toBe(0)
      expect(result.missingRecommended.length).toBe(0)
      expect(result.score).toBe(100)
    })
  })

  describe("Proveedores", () => {
    it("proveedor exige cuit siempre", () => {
      const ctx = { modoLite: "pos", rubro: "kiosco" }
      const reqs = getProveedorRequiredFields(ctx)
      expect(reqs.find(r => r.field === "cuit")?.severity).toBe("required")
    })
    
    it("proveedor completo exige condicionIva y recomienda telefono", () => {
      const ctx = { modoLite: "completo", rubro: "kiosco" }
      const reqs = getProveedorRequiredFields(ctx)
      expect(reqs.find(r => r.field === "condicionIva")?.severity).toBe("required")
      expect(reqs.find(r => r.field === "telefono")?.severity).toBe("recommended")
    })
  })
})
