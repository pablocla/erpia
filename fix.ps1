
$lines = Get-Content -Path "app\dashboard\ventas\page.tsx" -Encoding UTF8
$newLines = @()
$inserted = $false
foreach ($line in $lines) {
    $newLines += $line
    if ($line.Trim() -eq "useKeyboardShortcuts(erpShortcuts({ onRefresh: () => window.location.reload() }))" -and -not $inserted) {
        $inserted = $true
        $newLines += ""
        $newLines += "  // Auto-fill from URL parameters (e.g. from Fumigation module)"
        $newLines += "  useEffect(() => {"
        $newLines += "    if (typeof window === 'undefined' || clientes.length === 0) return"
        $newLines += "    const params = new URLSearchParams(window.location.search)"
        $newLines += "    const prefillClienteId = params.get('clienteId')"
        $newLines += "    if (prefillClienteId && !clienteSeleccionado) {"
        $newLines += "      const c = clientes.find((x) => x.id === Number(prefillClienteId))"
        $newLines += "      if (c) {"
        $newLines += "        setClienteSeleccionado(c)"
        $newLines += "        const prefillMonto = params.get('monto')"
        $newLines += "        const prefillDesc = params.get('descripcion')"
        $newLines += "        if (prefillMonto && items.length === 0) {"
        $newLines += "          const subtotal = Number(prefillMonto) / 1.21"
        $newLines += "          const ivaImporte = subtotal * 0.21"
        $newLines += "          const nuevaLinea = {"
        $newLines += "            id: crypto.randomUUID(),"
        $newLines += "            descripcion: prefillDesc || 'Servicio',"
        $newLines += "            cantidad: 1,"
        $newLines += "            precioUnitario: subtotal,"
        $newLines += "            iva: 21,"
        $newLines += "            subtotal: subtotal,"
        $newLines += "            ivaImporte: ivaImporte,"
        $newLines += "            total: subtotal + ivaImporte,"
        $newLines += "          }"
        $newLines += "          setItems([nuevaLinea as any])"
        $newLines += "        }"
        $newLines += "        window.history.replaceState({}, document.title, window.location.pathname)"
        $newLines += "      }"
        $newLines += "    }"
        $newLines += "  }, [clientes, clienteSeleccionado, items.length])"
    }
}
$newLines | Set-Content -Path "app\dashboard\ventas\page.tsx" -Encoding UTF8

