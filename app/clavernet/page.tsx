import { redirect } from "next/navigation"
import { PARTNER_PROGRAM } from "@/lib/partners/program-copy"

/** Clavernet legacy → landing oficial del Programa Partner */
export default function ClavernetHomeRedirect() {
  redirect(PARTNER_PROGRAM.paths.landing)
}
