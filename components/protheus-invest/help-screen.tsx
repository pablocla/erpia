"use client"

import Link from "next/link"
import { AlertTriangle, BookOpen, CheckCircle2, Cloud, Lock, Server } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function HelpScreen() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ayuda — Inversiones Protheus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mismo login Claver (email o Google). Cada empresa apunta a su AppServer. El core SIGA no se toca.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lock className="size-4" /> Operador
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Entrá a Claver → Inversiones Protheus. Licencia anual TOTVS (no trial ni Mercado Pago). Si el REST está cargado, ves Z02.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="size-4" /> Implementador
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Diccionario Z01/Z02/Z03, compilá los PRW, prendé HTTPREST y cargá la URL en Cloud → Legacy Bridge.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="size-4" /> Vercel / claver.com.ar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            La URL REST tiene que ser alcanzable desde internet (TOTVS Cloud HTTPS). Un 10.x de LAN no llega.
          </CardContent>
        </Card>
      </div>

      <Accordion type="multiple" defaultValue={["operador", "mvp"]} className="rounded-xl border px-4">
        <AccordionItem value="operador">
          <AccordionTrigger>Qué hace el tesorero (día a día)</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Login Claver (no hay usuario Protheus en esta pantalla).</p>
            <p>2. Menú Caja & Finanzas → Inversiones Protheus.</p>
            <p>3. Badge “Live SIGAFIN” = ya está leyendo el REST de tu tenant.</p>
            <p>4. Constituir: ND por FINA100 (sale de SA6). Rescatar: NC capital + NC/ND interés.</p>
            <p>5. Nunca se inserta SE5 a mano.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="campos">
          <AccordionTrigger>¿Hay que crear campos? ¿Y la localización Argentina?</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              Se reusan tal cual: SA6 (banco, agencia, cuenta, CBU loc. AR), SED (naturalezas), SE5 vía FINA100, SA1 CUIT, SM2 cotización, A1_CGC / M0_CGC.
            </p>
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              Protheus no tiene cartera mark-to-market. Hay que crear solo Z01, Z02 y Z03 (SX2/SX3). No se toca SIGAFIN nativo.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="compile">
          <AccordionTrigger>Compilar REST (TDS)</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>Orden: FINZINV.PRW → FINZRES.PRW → CLVINV01.PRW → JOBFINZ03.PRW (están en ADVPL de esta app).</p>
            <p>appserver.ini: [HTTPV11] Enable=1, [HTTPREST] con CORSEnable=1, URL=/rest.</p>
            <p>Health: GET https://HOST:8404/rest/api/claver/v1/investments/health</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="front">
          <AccordionTrigger>Apuntar el front (un cliente = un tenant)</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Claver Cloud → tenant → Legacy Bridge: origen Protheus, canal REST directo, URL HTTPS, usuario REST. Guardar.
            </p>
            <p>
              El operador no carga claves. Al entrar a{" "}
              <Link href="/dashboard/protheus" className="text-primary underline">
                /dashboard/protheus
              </Link>{" "}
              el proxy usa el REST de su empresaId.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="mvp">
          <AccordionTrigger>Alcance MVP</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>Incluye: login Claver, tenencias Z02, MTM Z03 tasa fija, alta/rescate FINA100, REST por tenant.</p>
            <p>Fuera de MVP: PPI cotizaciones en vivo, eCheq nativo, asiento CT2 automático, AppServer solo LAN (usar Edge Agent más adelante).</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="text-xs text-muted-foreground">
        <BookOpen className="mr-1 inline size-3.5" />
        Boletín completo: pestaña Boletín (PRW) y el ? de la barra superior.
      </p>
    </div>
  )
}
