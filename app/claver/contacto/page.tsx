import type { Metadata } from "next"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { ClaverVentasContacto } from "@/components/marketing/claver-ventas-contacto"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: `Contacto y ventas | ${CLAVER_GROUP.name}`,
  description:
    "Pedí una demo, agendá una reunión o escribinos por WhatsApp. Consultas comerciales de Claver ERP y POS para PyMEs argentinas.",
  alternates: { canonical: `${siteUrl}/claver/contacto` },
  openGraph: {
    title: `Contacto comercial | ${CLAVER_GROUP.name}`,
    description: "Demo, reunión o consulta — respondemos en 24 h hábiles.",
    url: `${siteUrl}/claver/contacto`,
  },
}

export default async function ClaverContactoPage({
  searchParams,
}: {
  searchParams?: Promise<{ pack?: string }>
}) {
  const sp = searchParams ? await searchParams : {}
  const isImplementacion = sp.pack === "implementacion"

  return (
    <ClaverShell context="matrix" theme="light">
      <div className="pt-24">
        <ClaverVentasContacto
          pagina={isImplementacion ? "/claver/contacto?pack=implementacion" : "/claver/contacto"}
          defaultTipo={isImplementacion ? "demo" : "contacto"}
          waMessage={
            isImplementacion
              ? "Hola Claver, quiero consultar por el pack de horas de implementación y puesta en marcha asistida para mi negocio."
              : undefined
          }
          variant="light"
        />
      </div>
    </ClaverShell>
  )
}