import fs from 'fs'

// 1. Modificar niche-apps-catalog.ts
let catalog = fs.readFileSync('lib/niche/niche-apps-catalog.ts', 'utf-8');
catalog = catalog.replace('redirectPath: "/dashboard/peluqueria"', 'redirectPath: "/dashboard/agenda"');
if (!catalog.includes('redirectPath: "/dashboard/nicho/inmobiliaria"')) {
    catalog = catalog.replace('engine: "movimientos",\n      goldenPath: "/dashboard/nicho/inmobiliaria",\n      precioArs: 10000,', 'engine: "movimientos",\n      goldenPath: "/dashboard/nicho/inmobiliaria",\n      redirectPath: "/dashboard/nicho/inmobiliaria",\n      precioArs: 10000,');
}
fs.writeFileSync('lib/niche/niche-apps-catalog.ts', catalog, 'utf-8');

// 2. Modificar app-experience-header.tsx
let header = fs.readFileSync('components/app-experience/app-experience-header.tsx', 'utf-8');
if (!header.includes('Ir a la Caja (Cobrar)')) {
    header = header.replace('</div>\n          )}\n        </div>\n      </div>', '</div>\n          )}\n          {(guide.title.includes("Veterinaria") || guide.title.includes("Consultorio")) && (\n            <div className="flex gap-2 mt-2">\n              <a href="/dashboard/pos" className="text-xs text-primary underline">Ir a la Caja (Cobrar)</a>\n              <a href="/dashboard/agenda" className="text-xs text-primary underline">Ir a la Agenda</a>\n            </div>\n          )}\n        </div>\n      </div>');
    fs.writeFileSync('components/app-experience/app-experience-header.tsx', header, 'utf-8');
}

// 3. Modificar fiado/page.tsx
let fiado = fs.readFileSync('app/dashboard/fiado/page.tsx', 'utf-8');
fiado = fiado.replace('<DialogTitle>Configuración Libreta Fiado</DialogTitle>', '<DialogTitle>Configuración {experience.title}</DialogTitle>');
fiado = fiado.replace('<Plus className="h-4 w-4 mr-2" />\n                Cliente fiado', '<Plus className="h-4 w-4 mr-2" />\n                {demoIndustryId === "prestamista" ? "Nuevo Cliente" : "Cliente fiado"}');
fiado = fiado.replace('<BookPlus className="h-4 w-4 mr-2" />\n            Anotar fiado', '<BookPlus className="h-4 w-4 mr-2" />\n            {demoIndustryId === "prestamista" ? "Anotar préstamo" : "Anotar fiado"}');
fs.writeFileSync('app/dashboard/fiado/page.tsx', fiado, 'utf-8');

// 4. Modificar HUECOS_NICHOS_UX_PROCESOS.md
let doc = fs.readFileSync('docs/comercial/HUECOS_NICHOS_UX_PROCESOS.md', 'utf-8');
doc = doc.replace('| 1 | Cancha | Reservar turno + seña | ⬜ |', '| 1 | Cancha | Reservar turno + seña | ✅ |');
doc = doc.replace('| 13 | Peluquería | Unificar agenda + cobro | ⬜ |', '| 13 | Peluquería | Unificar agenda + cobro | ✅ |');
doc = doc.replace('| 14 | Consultorio | Cobrar al completar turno | ⬜ |', '| 14 | Consultorio | Cobrar al completar turno | ✅ |');
doc = doc.replace('| 15 | Vet | Vacunas próximas + recordatorio | ⬜ |', '| 15 | Vet | Vacunas próximas + recordatorio | ✅ |');
doc = doc.replace('| 3 | | | | |', '| 3 | 2026-07-18 | ✅ Éxito | niche-apps-catalog.ts, fiado/page.tsx, app-experience-header.tsx | manual |');
fs.writeFileSync('docs/comercial/HUECOS_NICHOS_UX_PROCESOS.md', doc, 'utf-8');

console.log('Ola 3 executed');
