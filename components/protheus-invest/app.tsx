"use client"

import { InvestScreen } from "./invest-screen"
import { ProtheusInvestShell } from "./shell"

/** Compat: el showcase y landings montan la app completa sobre el shell Claver. */
export function ProtheusInvestApp() {
  return (
    <ProtheusInvestShell>
      <InvestScreen />
    </ProtheusInvestShell>
  )
}
