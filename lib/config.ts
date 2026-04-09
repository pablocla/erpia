// Configuración centralizada de la aplicación
export const config = {
  // Base de datos
  database: {
    url: process.env.DATABASE_URL!,
  },

  // AFIP
  afip: {
    entorno: (process.env.AFIP_ENTORNO || "homologacion") as "homologacion" | "produccion",
    cuit: process.env.AFIP_CUIT || "20123456789",
    puntoVenta: Number.parseInt(process.env.AFIP_PUNTO_VENTA || "1"),
    wsfeUrl:
      process.env.AFIP_ENTORNO === "produccion"
        ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
        : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
    wsaaUrl:
      process.env.AFIP_ENTORNO === "produccion"
        ? "https://wsaa.afip.gov.ar/ws/services/LoginCms"
        : "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === "production"
      ? (() => { throw new Error("JWT_SECRET requerido en producción") })()
      : "dev-only-local"),
    expiresIn: "7d",
  },

  // App
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    name: "POS Argentina",
  },

  // Impresora Fiscal
  printer: {
    type: (process.env.PRINTER_TYPE || "hasar") as "hasar" | "epson",
    port: process.env.PRINTER_PORT || "COM1",
  },
} as const

// Validar configuración requerida
export function validateConfig() {
  const required = ["DATABASE_URL", "JWT_SECRET"]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(", ")}`)
  }
}
