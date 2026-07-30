import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"
import {
  parsePkcs12,
  normalizePemToStorage,
  encryptPrivateKeyIfConfigured,
  readCertMeta,
} from "@/lib/afip/cert-utils"

/**
 * POST /api/afip/subir-certificados
 * Acepta:
 *  - form: cuit + certificadoCRT + certificadoKEY (PEM)
 *  - form: cuit + p12 (file) + password
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const formData = await request.formData()
    const cuit = (formData.get("cuit") as string | null)?.replace(/\D/g, "")
    if (!cuit) {
      return NextResponse.json({ error: "CUIT requerido" }, { status: 400 })
    }

    const empresa = await prisma.empresa.findUnique({ where: { cuit } })
    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada. Créela primero." },
        { status: 404 },
      )
    }

    // Multi-tenant: solo la empresa del usuario (salvo superadmin implícito)
    const userEmpresaId = (usuario as { empresaId?: number }).empresaId
    if (userEmpresaId && empresa.id !== userEmpresaId) {
      return NextResponse.json({ error: "CUIT no pertenece a tu empresa" }, { status: 403 })
    }

    let crtBase64: string
    let keyBase64: string
    let meta: ReturnType<typeof readCertMeta> | null = null

    const p12File = formData.get("p12") as File | null
    const password = (formData.get("password") as string | null) ?? ""

    if (p12File && typeof p12File.arrayBuffer === "function") {
      const buf = Buffer.from(await p12File.arrayBuffer())
      try {
        const parsed = parsePkcs12(buf, password)
        crtBase64 = parsed.certificadoCRT
        keyBase64 = parsed.certificadoKEY
        meta = readCertMeta(crtBase64)
      } catch (e) {
        return NextResponse.json(
          {
            error: `No se pudo leer el PKCS#12: ${e instanceof Error ? e.message : String(e)}`,
          },
          { status: 400 },
        )
      }
    } else {
      const certificadoCRT = formData.get("certificadoCRT") as string | null
      const certificadoKEY = formData.get("certificadoKEY") as string | null
      if (!certificadoCRT || !certificadoKEY) {
        return NextResponse.json(
          {
            error:
              "Faltan datos: enviá certificadoCRT+certificadoKEY (PEM) o archivo p12+password",
          },
          { status: 400 },
        )
      }
      crtBase64 = normalizePemToStorage(certificadoCRT)
      keyBase64 = normalizePemToStorage(certificadoKEY)
      try {
        meta = readCertMeta(crtBase64)
      } catch {
        meta = null
      }
    }

    if (meta?.estado === "VENCIDO") {
      return NextResponse.json(
        {
          error: `El certificado está vencido (vence ${meta.notAfter.toISOString().slice(0, 10)})`,
        },
        { status: 400 },
      )
    }

    const keyStored = encryptPrivateKeyIfConfigured(keyBase64)

    await prisma.empresa.update({
      where: { cuit },
      data: {
        certificadoCRT: crtBase64,
        certificadoKEY: keyStored,
      },
    })

    return NextResponse.json({
      success: true,
      mensaje: "Certificados guardados correctamente",
      certificado: meta
        ? {
            subjectCn: meta.subjectCn,
            notAfter: meta.notAfter.toISOString(),
            daysToExpiry: meta.daysToExpiry,
            estado: meta.estado,
            cifradoKey: keyStored.startsWith("enc:v1:"),
          }
        : undefined,
    })
  } catch (error) {
    console.error("Error al subir certificados:", error)
    return NextResponse.json({ error: "Error al guardar certificados" }, { status: 500 })
  }
}
