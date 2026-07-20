import { redirect } from "next/navigation"
import { PARTNER_PROGRAM } from "@/lib/partners/program-copy"

/** Portal de afiliados real (API + billetera) vive en el dashboard ERP */
export default function ClavernetDashboardRedirect() {
  redirect(PARTNER_PROGRAM.paths.portal)
}
