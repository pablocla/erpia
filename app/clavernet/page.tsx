import { redirect } from "next/navigation"

/** Clavernet deprecado — unificado en Grupo Claver */
export default function ClavernetLegacyRedirectPage() {
  redirect("/claver")
}