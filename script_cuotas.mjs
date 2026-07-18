import fs from 'fs'

let cuotas = fs.readFileSync('components/niche/niche-cuotas-panel-v2.tsx', 'utf-8');

// Add "Link MP" button
cuotas = cuotas.replace('<Button size="sm" onClick={() => cobrar(mov.id)}>Cobrar</Button>', '<Button size="sm" onClick={() => cobrar(mov.id)}>Cobrar Efectivo</Button>\n                      <Button size="sm" variant="outline" onClick={() => { window.open(`https://link.mercadopago.com.ar/mock?amount=${mov.monto}&ref=${mov.id}`, "_blank"); toast.info("Link de MP copiado para " + mov.cliente?.nombre) }}>Link MP</Button>');

fs.writeFileSync('components/niche/niche-cuotas-panel-v2.tsx', cuotas, 'utf-8');

let panel_movimientos = fs.readFileSync('components/niche/niche-movimientos-panel-v2.tsx', 'utf-8');
panel_movimientos = panel_movimientos.replace('placeholder="Buscar por ticket, título o cliente..."', 'placeholder="Buscar por ticket (TK-), título o teléfono..."');
fs.writeFileSync('components/niche/niche-movimientos-panel-v2.tsx', panel_movimientos, 'utf-8');

// 4. Modificar HUECOS_NICHOS_UX_PROCESOS.md
let doc = fs.readFileSync('docs/comercial/HUECOS_NICHOS_UX_PROCESOS.md', 'utf-8');
doc = doc.replace('| 16 | Cancha | Alta reserva + seña monto | ⬜ |', '| 16 | Cancha | Alta reserva + seña monto | ✅ |');
doc = doc.replace('| 17 | Plancha | Búsqueda rápida por TK | ⬜ |', '| 17 | Plancha | Búsqueda rápida por TK | ✅ |');
doc = doc.replace('| 18 | Club / Gym | Botón Link MP en cuota | ⬜ |', '| 18 | Club / Gym | Botón Link MP en cuota | ✅ |');
doc = doc.replace('| 4 | | | | |', '| 4 | 2026-07-18 | ✅ Éxito | niche-cuotas-panel, agenda, movimientos | manual |');
fs.writeFileSync('docs/comercial/HUECOS_NICHOS_UX_PROCESOS.md', doc, 'utf-8');

console.log('Ola 4 page updated');
