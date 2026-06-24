import { redirect } from "next/navigation"

/** Redirige al centro unificado de alertas */
export default function AlertasRedirectPage() {
  redirect("/dashboard/centro-alertas?tab=reglas")
}