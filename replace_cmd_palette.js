const fs = require('fs');
let code = fs.readFileSync('components/command-palette.tsx', 'utf8');

code = code.replace(
  '  const [docItems, setDocItems] = useState<any[]>([])',
  '  const [docItems, setDocItems] = useState<any[]>([])\n  const [modoLite, setModoLite] = useState<string>("completo")'
);

code = code.replace(
  'fetchDocsIndex()\n  }, [commandPaletteOpen])',
  `    const fetchModoLite = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = token ? { Authorization: \`Bearer \${token}\` } : {}
        const res = await fetch("/api/config/empresa", { headers })
        if (res.ok) {
          const data = await res.json()
          if (data?.modoLite) setModoLite(data.modoLite)
        }
      } catch (err) {
        // ignore
      }
    }

    fetchDocsIndex()
    fetchModoLite()
  }, [commandPaletteOpen])`
);

code = code.replace(
  'const sections = ROUTES.reduce',
  `const isFiado = modoLite === "fiado"
  const isCobra = modoLite === "cobranza"
  const isTurnos = modoLite === "turnos"
  
  const filteredRoutes = ROUTES.filter(route => {
    if (modoLite === "completo") return true
    if (route.href === "/dashboard") return true
    if (isFiado && route.section === "Ventas") return true
    if (isCobra && route.section === "Financiero") return true
    if (isTurnos && route.section === "Servicios") return true
    if (route.section === "Configuración") return true
    return false
  })

  const sections = filteredRoutes.reduce`
);

code = code.replace(
  '<CommandGroup heading={t("groups.quickActions")}>',
  `<CommandGroup heading={t("groups.quickActions")}>
          {modoLite === "cobranza" && (
            <CommandItem value="enviar link de cobro" onSelect={() => navigate("/dashboard/cuentas-cobrar")}>
              <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Enviar link de cobro</span>
              <CommandShortcut>EC</CommandShortcut>
            </CommandItem>
          )}
          {modoLite === "fiado" && (
            <CommandItem value="nuevo cliente fiado" onSelect={() => navigate("/dashboard/clientes")}>
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Nuevo cliente (Fiado)</span>
              <CommandShortcut>NF</CommandShortcut>
            </CommandItem>
          )}
          {modoLite === "turnos" && (
            <CommandItem value="nuevo turno rapido" onSelect={() => navigate("/dashboard/agenda")}>
              <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Agendar Turno</span>
              <CommandShortcut>AT</CommandShortcut>
            </CommandItem>
          )}`
);

fs.writeFileSync('components/command-palette.tsx', code);
