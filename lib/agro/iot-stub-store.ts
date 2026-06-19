type SensorTipo =
  | "HUMEDAD_SUELO"
  | "TEMPERATURA_SUELO"
  | "TEMPERATURA_AIRE"
  | "CAUDAL_RIEGO"
  | "PRESION_AGUA"
  | "LLUVIA"
  | "VIENTO"

type MaquinaMarca =
  | "JOHN_DEERE"
  | "AGCO"
  | "CASE_IH"
  | "NEW_HOLLAND"
  | "PAUNY"
  | "APACHE"
  | "OTRO"

export interface StubSensor {
  id: number
  nombre: string
  tipo: SensorTipo
  deviceEUI: string
  loteId: number
  empresaId: number
  lat: number | null
  lon: number | null
  activo: boolean
}

export interface StubLectura {
  id: number
  sensorId: number
  valor: number
  unidad: string
  timestamp: string
  empresaId: number
}

export interface StubZonaRiego {
  id: number
  nombre: string
  loteId: number
  empresaId: number
  activa: boolean
  tipoRiego: "GOTEO" | "ASPERSION" | "PIVOTE"
  caudal: number | null
}

export interface StubProgramaRiego {
  id: number
  zonaId: number
  nombre: string
  diaSemana: number[]
  horaInicio: string
  duracionMin: number
  activo: boolean
  empresaId: number
}

export interface StubEventoRiego {
  id: number
  zonaId: number
  inicio: string
  fin: string | null
  duracionMin: number | null
  volumenLitros: number | null
  trigger: "MANUAL" | "PROGRAMADO" | "SENSOR" | "IA"
  operadorId: number | null
  empresaId: number
}

export interface StubMaquina {
  id: number
  nombre: string
  marca: MaquinaMarca
  modeloNombre: string | null
  apiMachineId: string | null
  empresaId: number
}

export interface StubMaquinaLog {
  id: number
  maquinaId: number
  timestamp: string
  lat: number | null
  lon: number | null
  velocidad: number | null
  operacion: string | null
  horasMotor: number | null
  combustible: number | null
  empresaId: number
}

const db = {
  sensors: [] as StubSensor[],
  lecturas: [] as StubLectura[],
  zonas: [] as StubZonaRiego[],
  programas: [] as StubProgramaRiego[],
  eventos: [] as StubEventoRiego[],
  maquinas: [] as StubMaquina[],
  maquinaLogs: [] as StubMaquinaLog[],
}

const seq = {
  sensor: 1,
  lectura: 1,
  zona: 1,
  programa: 1,
  evento: 1,
  maquina: 1,
  maquinaLog: 1,
}

export function ensureIoTSeeds(empresaId: number, loteIds: number[]) {
  if (db.sensors.some((s) => s.empresaId === empresaId)) return
  const baseLote = loteIds[0] ?? 1
  const loteB = loteIds[1] ?? baseLote

  const s1 = addSensor({
    nombre: "Humedad Suelo - Lote A",
    tipo: "HUMEDAD_SUELO",
    deviceEUI: `EUI-${empresaId}-A`,
    loteId: baseLote,
    empresaId,
    lat: null,
    lon: null,
    activo: true,
  })
  const s2 = addSensor({
    nombre: "Temperatura Aire - Lote A",
    tipo: "TEMPERATURA_AIRE",
    deviceEUI: `EUI-${empresaId}-B`,
    loteId: baseLote,
    empresaId,
    lat: null,
    lon: null,
    activo: true,
  })
  const s3 = addSensor({
    nombre: "Caudal Riego - Lote B",
    tipo: "CAUDAL_RIEGO",
    deviceEUI: `EUI-${empresaId}-C`,
    loteId: loteB,
    empresaId,
    lat: null,
    lon: null,
    activo: true,
  })

  const now = Date.now()
  for (let i = 24; i >= 0; i--) {
    const ts = new Date(now - i * 60 * 60 * 1000).toISOString()
    addLectura({ sensorId: s1.id, empresaId, valor: 18 + Math.sin(i / 3) * 6, unidad: "%", timestamp: ts })
    addLectura({ sensorId: s2.id, empresaId, valor: 20 + Math.cos(i / 2) * 5, unidad: "°C", timestamp: ts })
    addLectura({ sensorId: s3.id, empresaId, valor: 240 + Math.sin(i / 2) * 40, unidad: "L/min", timestamp: ts })
  }

  const z1 = addZona({ nombre: "Zona A - Pivote 1", loteId: baseLote, empresaId, activa: false, tipoRiego: "PIVOTE", caudal: 9000 })
  addPrograma({ zonaId: z1.id, empresaId, nombre: "Madrugada", diaSemana: [1, 3, 5], horaInicio: "05:30", duracionMin: 40, activo: true })

  const m1 = addMaquina({ nombre: "John Deere 8R 310", marca: "JOHN_DEERE", modeloNombre: "8R 310", apiMachineId: "JD-FAKE-001", empresaId })
  addMaquinaLog({ maquinaId: m1.id, empresaId, timestamp: new Date().toISOString(), lat: null, lon: null, velocidad: 18, operacion: "SIEMBRA", horasMotor: 6.2, combustible: 34 })
}

export function listSensors(empresaId: number, loteId?: number) {
  return db.sensors.filter((s) => s.empresaId === empresaId && (loteId ? s.loteId === loteId : true))
}

export function addSensor(data: Omit<StubSensor, "id">): StubSensor {
  const row: StubSensor = { id: seq.sensor++, ...data }
  db.sensors.push(row)
  return row
}

export function findSensorByDeviceEUI(deviceEUI: string, empresaId: number) {
  return db.sensors.find((s) => s.deviceEUI === deviceEUI && s.empresaId === empresaId)
}

export function findSensor(sensorId: number, empresaId: number) {
  return db.sensors.find((s) => s.id === sensorId && s.empresaId === empresaId)
}

export function addLectura(data: Omit<StubLectura, "id">): StubLectura {
  const row: StubLectura = { id: seq.lectura++, ...data }
  db.lecturas.push(row)
  return row
}

export function listLecturas(sensorId: number, empresaId: number, hours: number, limit: number) {
  const since = Date.now() - hours * 60 * 60 * 1000
  return db.lecturas
    .filter((l) => l.sensorId === sensorId && l.empresaId === empresaId && new Date(l.timestamp).getTime() >= since)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit)
}

export function listZonas(empresaId: number, loteId?: number) {
  return db.zonas.filter((z) => z.empresaId === empresaId && (loteId ? z.loteId === loteId : true))
}

export function addZona(data: Omit<StubZonaRiego, "id">): StubZonaRiego {
  const row: StubZonaRiego = { id: seq.zona++, ...data }
  db.zonas.push(row)
  return row
}

export function findZona(zonaId: number, empresaId: number) {
  return db.zonas.find((z) => z.id === zonaId && z.empresaId === empresaId)
}

export function listProgramas(zonaId: number, empresaId: number) {
  return db.programas.filter((p) => p.zonaId === zonaId && p.empresaId === empresaId)
}

export function addPrograma(data: Omit<StubProgramaRiego, "id">): StubProgramaRiego {
  const row: StubProgramaRiego = { id: seq.programa++, ...data }
  db.programas.push(row)
  return row
}

export function updatePrograma(programaId: number, empresaId: number, patch: Partial<StubProgramaRiego>) {
  const row = db.programas.find((p) => p.id === programaId && p.empresaId === empresaId)
  if (!row) return null
  Object.assign(row, patch)
  return row
}

export function deletePrograma(programaId: number, empresaId: number) {
  const idx = db.programas.findIndex((p) => p.id === programaId && p.empresaId === empresaId)
  if (idx === -1) return false
  db.programas.splice(idx, 1)
  return true
}

export function createEvento(data: Omit<StubEventoRiego, "id">): StubEventoRiego {
  const row: StubEventoRiego = { id: seq.evento++, ...data }
  db.eventos.push(row)
  return row
}

export function closeEvento(zonaId: number, empresaId: number) {
  const open = [...db.eventos].reverse().find((e) => e.zonaId === zonaId && e.empresaId === empresaId && e.fin === null)
  if (!open) return null
  const end = new Date().toISOString()
  const duracionMin = Math.max(1, Math.round((new Date(end).getTime() - new Date(open.inicio).getTime()) / 60000))
  open.fin = end
  open.duracionMin = duracionMin
  const zona = findZona(zonaId, empresaId)
  open.volumenLitros = zona?.caudal ? Math.round((zona.caudal / 60) * duracionMin) : null
  return open
}

export function listEventos(zonaId: number, empresaId: number) {
  return db.eventos.filter((e) => e.zonaId === zonaId && e.empresaId === empresaId).sort((a, b) => (a.inicio < b.inicio ? 1 : -1))
}

export function listMaquinas(empresaId: number) {
  return db.maquinas.filter((m) => m.empresaId === empresaId)
}

export function addMaquina(data: Omit<StubMaquina, "id">): StubMaquina {
  const row: StubMaquina = { id: seq.maquina++, ...data }
  db.maquinas.push(row)
  return row
}

export function addMaquinaLog(data: Omit<StubMaquinaLog, "id">): StubMaquinaLog {
  const row: StubMaquinaLog = { id: seq.maquinaLog++, ...data }
  db.maquinaLogs.push(row)
  return row
}

export function listMaquinaLogs(maquinaId: number, empresaId: number, limit = 10) {
  return db.maquinaLogs
    .filter((m) => m.maquinaId === maquinaId && m.empresaId === empresaId)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit)
}
