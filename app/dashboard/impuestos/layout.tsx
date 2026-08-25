import { FiscalRouteGuard } from "./route-guard"

export default function ImpuestosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <FiscalRouteGuard />
      {children}
    </>
  )
}
