import { redirect } from "next/navigation"

export default async function RedirectTenantOperaciones({ params }: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = await params
  redirect(`/claver-cloud/operations/${empresaId}`)
}