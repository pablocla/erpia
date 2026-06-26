import { ClaverCloudGuard } from "@/components/claver-cloud/claver-cloud-guard"
import { CloudShell } from "@/components/claver-cloud/cloud-shell"

export default function ClaverCloudLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClaverCloudGuard>
      <div className="dark bg-background text-foreground min-h-screen">
        <CloudShell>{children}</CloudShell>
      </div>
    </ClaverCloudGuard>
  )
}
