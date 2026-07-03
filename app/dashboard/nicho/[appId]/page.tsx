import { notFound, redirect } from "next/navigation"
import { getNicheApp } from "@/lib/niche/niche-apps-catalog"
import { NicheAppShell } from "@/components/niche/niche-app-shell"

export default async function NicheAppPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { appId } = await params
  const app = getNicheApp(appId)
  if (!app) notFound()

  if (app.redirectPath) {
    redirect(app.redirectPath)
  }

  return <NicheAppShell app={app} />
}