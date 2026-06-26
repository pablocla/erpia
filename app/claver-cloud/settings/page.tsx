"use client"

import Link from "next/link"
import { Settings, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClaverSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Manage assignments, users, and platform entitlements.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              Tenant Assignments
            </CardTitle>
            <CardDescription>
              Asignación de consultores funcionales y analistas de soporte a cuentas de clientes específicas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/claver-cloud/settings/assignments" className="flex items-center justify-center gap-2">
                Administrar Asignaciones
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
