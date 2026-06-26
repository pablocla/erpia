import { redirect } from "next/navigation"

/** Alias histórico → landing unificada bajo matriz Claver */
export default function ClaverpEcommerceRedirectPage() {
  redirect("/claver/ecommerce")
}