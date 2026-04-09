/**
 * POST /api/afip/setup-homologacion
 *
 * Lee los certificados del directorio /certificadosafip/ y los carga en la BD
 * para poder testear la transmisión con AFIP Homologación.
 *
 * Solo disponible cuando AFIP_ENTORNO !== "produccion".
 *
 * Body (opcional): { cuit?: string, razonSocial?: string, puntoVenta?: number }
 * Si no se pasan, se usan los valores del .env / defaults de homologación.
 */

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    // Bloquear en producción
    if (process.env.AFIP_ENTORNO === "produccion") {
      return NextResponse.json(
        { error: "Este endpoint solo está disponible en entorno de homologación." },
        { status: 403 },
      )
    }

    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json().catch(() => ({}))

    // CUIT prioritized: body → env → default del certificado
    const cuit: string =
      (body.cuit as string | undefined)?.replace(/-/g, "") ||
      process.env.AFIP_CUIT?.replace(/-/g, "") ||
      "20237878486" // CUIT que figura en el certificado de homologación

    const razonSocial: string = (body.razonSocial as string | undefined) || "Empresa Homologación"
    const puntoVenta: number = (body.puntoVenta as number | undefined) || 1

    // Validar formato CUIT
    if (!/^\d{11}$/.test(cuit)) {
      return NextResponse.json({ error: `CUIT inválido: "${cuit}" (debe tener 11 dígitos sin guiones)` }, { status: 400 })
    }

    // Leer certificados desde el directorio del proyecto
    const certsDir = path.resolve(process.cwd(), "certificadosafip")

    const crtPath = path.join(certsDir, "ouphomol.crt")
    const keyPath = path.join(certsDir, "oup22key.key")

    if (!fs.existsSync(crtPath)) {
      return NextResponse.json(
        { error: `Certificado CRT no encontrado en: ${crtPath}` },
        { status: 404 },
      )
    }
    if (!fs.existsSync(keyPath)) {
      return NextResponse.json(
        { error: `Clave privada KEY no encontrada en: ${keyPath}` },
        { status: 404 },
      )
    }

    const certPem = fs.readFileSync(crtPath, "utf8")
    const keyPem  = fs.readFileSync(keyPath, "utf8")

    // Validar que tenga el formato PEM esperado
    if (!certPem.includes("-----BEGIN CERTIFICATE-----")) {
      return NextResponse.json({ error: "ouphomol.crt no contiene un certificado PEM válido." }, { status: 400 })
    }
    if (!keyPem.includes("-----BEGIN RSA PRIVATE KEY-----") && !keyPem.includes("-----BEGIN PRIVATE KEY-----")) {
      return NextResponse.json({ error: "oup22key.key no contiene una clave privada PEM válida." }, { status: 400 })
    }

    // Codificar en base64 para almacenar en la BD (mismo formato que subir-certificados)
    const crtBase64 = Buffer.from(certPem).toString("base64")
    const keyBase64 = Buffer.from(keyPem).toString("base64")

    // Upsert empresa
    const empresa = await prisma.empresa.upsert({
      where: { cuit },
      update: {
        certificadoCRT: crtBase64,
        certificadoKEY: keyBase64,
      },
      create: {
        cuit,
        nombre: razonSocial,
        razonSocial,
        puntoVenta,
        entorno: "homologacion",
        certificadoCRT: crtBase64,
        certificadoKEY: keyBase64,
      },
    })

    return NextResponse.json({
      success: true,
      mensaje: `Certificados de homologación cargados para CUIT ${cuit}.`,
      empresa: {
        id: empresa.id,
        cuit: empresa.cuit,
        razonSocial: empresa.razonSocial,
        puntoVenta: empresa.puntoVenta,
        tieneCertificado: true,
      },
      nota: [
        "El CUIT del certificado (ouphomol.crt) es 20237878486.",
        "Si tu empresa emisora tiene un CUIT diferente, asegurate de haber configurado",
        "la delegación en el portal web de AFIP: https://auth.afip.gob.ar/contribuyente/",
        "Para emitir facturas usá POST /api/afip/test-conexion con { cuit: '...' }",
      ],
    })
  } catch (error) {
    console.error("Error en setup-homologacion:", error)
    return NextResponse.json({ error: "Error interno al cargar certificados" }, { status: 500 })
  }
}
