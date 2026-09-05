import type { Metadata } from "next"
import { ErpFacebookLanding } from "@/components/marketing/erp-facebook-landing"

export const metadata: Metadata = {
  title: "Claver ERP — caja, stock, factura y cobro",
  description:
    "Un sistema para el comercio argentino: punto de venta, stock, caja, factura AFIP, cobro, turnos y compras.",
  robots: { index: true, follow: true },
}

export default function ErpFacebookPage() {
  return <ErpFacebookLanding />
}
