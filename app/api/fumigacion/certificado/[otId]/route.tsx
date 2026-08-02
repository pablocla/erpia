import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { renderToStream } from "@react-pdf/renderer"
import React from "react"
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import { parseMeta } from "@/lib/ot-utils"
import { labelPlaga, labelTipoServicio } from "@/lib/fumigacion/constants"

// We use default fonts for simplicity, you can register custom fonts if needed
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 12, color: "#333" },
  header: { borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  section: { margin: "10px 0", padding: "10px 0" },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: 150, fontWeight: "bold" },
  value: { flex: 1 },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", fontSize: 10, color: "#999", borderTop: "1px solid #eee", paddingTop: 10 },
  signature: { marginTop: 50, width: 200, borderTop: "1px solid #333", paddingTop: 5, textAlign: "center", fontSize: 10 }
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ otId: string }> }) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const otIdParam = (await params).otId
  const otId = Number(otIdParam)
  
  if (isNaN(otId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  try {
    const ot = await prisma.ordenServicio.findFirst({
      where: {
        id: otId,
        empresaId: auth.auth.empresaId,
      },
      include: {
        cliente: true,
      }
    })

    if (!ot) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const meta = parseMeta(ot.metadata)
    
    // Fallbacks
    const fechaFormat = ot.fechaCreacion.toLocaleDateString("es-AR")
    const vencimientoStr = meta.fechaVencimientoCertificado 
      ? new Date(meta.fechaVencimientoCertificado).toLocaleDateString("es-AR")
      : "No especificado"

    // Construct PDF Document
    const MyDoc = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Certificado de Fumigación</Text>
            <Text style={styles.subtitle}>Comprobante de Tratamiento de Plagas</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>Nro de Certificado:</Text>
              <Text style={styles.value}>{ot.numero}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha de Tratamiento:</Text>
              <Text style={styles.value}>{fechaFormat}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Válido hasta:</Text>
              <Text style={styles.value}>{vencimientoStr}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Datos del Cliente</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Comercio / Razón Social:</Text>
              <Text style={styles.value}>{ot.cliente.nombre}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>CUIT / DNI:</Text>
              <Text style={styles.value}>{ot.cliente.numeroDocumento || "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{meta.direccionSitio || ot.cliente.direccion || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Detalle del Servicio</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Plaga Objetivo:</Text>
              <Text style={styles.value}>{labelPlaga(meta.plaga)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo de Servicio:</Text>
              <Text style={styles.value}>{labelTipoServicio(meta.tipoServicio)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Técnico Asignado:</Text>
              <Text style={styles.value}>{ot.usuarioAsignado || "No especificado"}</Text>
            </View>
          </View>

          <View style={styles.signature}>
            <Text>Firma y Aclaración Empresa</Text>
          </View>

          <View style={styles.footer}>
            <Text>Este certificado es un documento oficial emitido a través de Claver Fumigación</Text>
            <Text>Para verificar autenticidad conserve el Nro de Orden: {ot.numero}</Text>
          </View>
        </Page>
      </Document>
    )

    const stream = await renderToStream(<MyDoc />)
    
    // We must return a ReadableStream to Next.js
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk))
        stream.on('end', () => controller.close())
        stream.on('error', (err) => controller.error(err))
      }
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificado_${ot.numero}.pdf"`,
      }
    })

  } catch (error) {
    console.error("[GET /api/fumigacion/certificado]", error)
    return NextResponse.json({ error: "Error generando certificado" }, { status: 500 })
  }
}
