import fs from 'fs'

let agenda = fs.readFileSync('app/dashboard/agenda/page.tsx', 'utf-8');

// Modificar estado initial
agenda = agenda.replace('const [form, setForm] = useState({ horaInicio: "09:00", motivo: "", notas: "", profesionalId: "", duracion: "30", servicioId: "" })', 'const [form, setForm] = useState({ horaInicio: "09:00", motivo: "", notas: "", profesionalId: "", duracion: "30", servicioId: "", sena: "" })');

// Modificar agregarTurno body
agenda = agenda.replace('notas: form.notas || undefined,', 'notas: form.sena ? (form.notas ? form.notas + "\\n[Seña Abonada: $" + form.sena + "]" : "[Seña Abonada: $" + form.sena + "]") : (form.notas || undefined),');

// Inject input field in JSX
agenda = agenda.replace('<div className="space-y-2">\n                  <Label>Notas</Label>\n                  <Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Notas internas..." />\n                </div>', '<div className="space-y-2">\n                  <Label>Seña (Opcional)</Label>\n                  <Input type="number" value={form.sena} onChange={e => setForm({ ...form, sena: e.target.value })} placeholder="Monto a cobrar ahora..." />\n                </div>\n                <div className="space-y-2">\n                  <Label>Notas</Label>\n                  <Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Notas internas..." />\n                </div>');

fs.writeFileSync('app/dashboard/agenda/page.tsx', agenda, 'utf-8');
console.log('agenda page updated');
