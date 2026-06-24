import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { isClaverAnalyst } from "@/lib/auth/claver-analyst"
import { CloudShell } from "@/components/claver-cloud/cloud-shell"

export default async function ClaverCloudLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const email = headersList.get("x-user-email")
  const rol = headersList.get("x-user-rol")

  // Solo permitir acceso a analistas CLAVER
  if (!email || !isClaverAnalyst(email, rol ?? undefined)) {
    redirect("/dashboard")
  }

  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <CloudShell>{children}</CloudShell>
    </div>
  )
}
