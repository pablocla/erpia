import { CloudShell } from "@/components/claver-cloud/cloud-shell"
import { ClaverCloudGuard } from "@/components/claver-cloud/claver-cloud-guard"

export default function ClaverCloudLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClaverCloudGuard>
      <div data-shell="cloud" className="dark cloud-platform min-h-screen bg-background text-foreground">
        <CloudShell>{children}</CloudShell>
      </div>
    </ClaverCloudGuard>
  )
}