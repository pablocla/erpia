import { motion } from "framer-motion"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  etiqueta: string
  valor: string | number
  variacion?: number
  formato?: "moneda" | "numero" | "porcentaje"
  loading?: boolean
}

export function KpiCard({ etiqueta, valor, variacion, formato = "numero", loading }: KpiCardProps) {
  const formateado =
    typeof valor === "number"
      ? new Intl.NumberFormat("es-AR", {
          style: formato === "moneda" ? "currency" : formato === "porcentaje" ? "percent" : "decimal",
          currency: "ARS",
          maximumFractionDigits: 0,
        }).format(formato === "porcentaje" ? valor / 100 : valor)
      : valor

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground">{etiqueta}</p>
        <div className="mt-2 flex items-baseline gap-2">
          {loading ? (
            <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          ) : (
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight"
            >
              {formateado}
            </motion.h2>
          )}
        </div>
        
        {variacion !== undefined && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "mt-2 flex items-center text-xs font-medium",
              variacion > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
            )}
          >
            {variacion > 0 ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
            {Math.abs(variacion)}% vs mes anterior
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
