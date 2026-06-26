"use client"
import { motion } from "framer-motion"

export type ModalidadConsumo = "dine_in" | "takeaway" | "delivery"

interface ConsumoSwitchProps {
  value: ModalidadConsumo
  onChange: (val: ModalidadConsumo) => void
}

export function ConsumoSwitch({ value, onChange }: ConsumoSwitchProps) {
  const options: { id: ModalidadConsumo; label: string; icon: string }[] = [
    { id: "dine_in", label: "Comer Aquí", icon: "🍽️" },
    { id: "takeaway", label: "Para Llevar", icon: "🛍️" },
    { id: "delivery", label: "Delivery", icon: "🛵" },
  ]

  return (
    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full max-w-md shadow-inner">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`relative flex-1 py-2 text-sm font-medium transition-colors z-10 ${
            value === opt.id ? "text-blue-700 dark:text-blue-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          {value === opt.id && (
            <motion.div
              layoutId="consumo-indicator"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-slate-200 dark:border-slate-600 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="mr-2">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}
