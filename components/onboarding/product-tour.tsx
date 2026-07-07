"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuthStore } from "@/lib/stores"

export function ProductTour() {
  const [mounted, setMounted] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !user) return

    // Solo mostrar el tour si es un usuario de demostración
    const isDemoUser = user.email?.startsWith("demo-")
    
    // Y solo mostrarlo una vez
    const hasSeenTour = localStorage.getItem("claver-tour-seen")

    if (isDemoUser && !hasSeenTour) {
      // Damos un pequeño retraso para asegurar que la UI terminó de cargar
      const timer = setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          animate: true,
          nextBtnText: "Siguiente →",
          prevBtnText: "← Atrás",
          doneBtnText: "¡Entendido!",
          steps: [
            {
              popover: {
                title: "👋 ¡Bienvenido a tu entorno de prueba!",
                description: "Hemos preparado este entorno con datos falsos de tu rubro para que juegues tranquilo. Nada de lo que hagas aquí romperá nada.",
                side: "left",
                align: "start"
              }
            },
            {
              element: "#sidebar-menu", // Asumiendo que el sidebar tiene este ID o similar
              popover: {
                title: "Menú Principal",
                description: "Aquí encontrarás todos los módulos activos para tu rubro. Navega por las secciones para explorar.",
                side: "right",
                align: "start"
              }
            },
            {
              element: "#main-action-button", // Necesitaremos agregar un id al boton principal de creacion (ej. Nueva Factura)
              popover: {
                title: "Tu primera acción",
                description: "Haz clic aquí para crear tu primera operación. Recuerda que los clientes y productos ya están cargados para probar.",
                side: "bottom",
                align: "start"
              }
            },
            {
              popover: {
                title: "¡Todo listo!",
                description: "Si te pierdes, puedes reiniciar esta demo volviendo a la página principal. ¡A probar!",
                side: "top",
                align: "center"
              }
            }
          ],
          onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("¿Seguro que quieres saltar el tutorial?")) {
              localStorage.setItem("claver-tour-seen", "true")
              driverObj.destroy()
            }
          }
        })
        
        driverObj.drive()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [mounted, user])

  return null
}
