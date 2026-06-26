import { redirect } from "next/navigation"

/** Ruta legacy — ecommerce vive bajo /claver/ecommerce */
export default function EcommerceLegacyRedirectPage() {
  redirect("/claver/ecommerce")
}