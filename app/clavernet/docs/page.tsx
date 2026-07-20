import { redirect } from "next/navigation"
import { PARTNER_PROGRAM } from "@/lib/partners/program-copy"

/** Docs Clavernet → reglas del programa unificado */
export default function ClavernetDocsRedirect() {
  redirect(`${PARTNER_PROGRAM.paths.landing}#reglas`)
}
