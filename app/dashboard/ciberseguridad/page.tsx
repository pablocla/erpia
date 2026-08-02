"use client"

import React, { useState } from "react"
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Activity, 
  Users, 
  Database,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Search,
  Filter
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Mock Data ---
const loginAttemptsData = [
  { time: "00:00", success: 40, failed: 2 },
  { time: "04:00", success: 20, failed: 1 },
  { time: "08:00", success: 120, failed: 15 },
  { time: "12:00", success: 250, failed: 5 },
  { time: "16:00", success: 210, failed: 3 },
  { time: "20:00", success: 90, failed: 45 }, // Pico anómalo simulado
  { time: "24:00", success: 30, failed: 4 },
]

const auditLogs = [
  {
    id: "LOG-001",
    timestamp: "Hoy 20:15",
    user: "admin@empresa.com",
    event: "Múltiples inicios de sesión fallidos",
    ip: "190.220.15.42",
    severity: "high",
    status: "Bloqueado",
  },
  {
    id: "LOG-002",
    timestamp: "Hoy 16:30",
    user: "sistema",
    event: "Rotación de token JWT",
    ip: "localhost",
    severity: "info",
    status: "Completado",
  },
  {
    id: "LOG-003",
    timestamp: "Hoy 12:45",
    user: "vendedor1@empresa.com",
    event: "Exportación masiva de clientes",
    ip: "181.44.20.100",
    severity: "medium",
    status: "En revisión",
  },
  {
    id: "LOG-004",
    timestamp: "Hoy 09:10",
    user: "admin@empresa.com",
    event: "Cambio de permisos (Rol: Cajero)",
    ip: "190.10.10.10",
    severity: "info",
    status: "Completado",
  },
]

export default function CiberseguridadPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleForceLogout = () => {
    // Aquí iría la lógica para invalidar todas las sesiones
    alert("Iniciando cierre de sesión global. Esto desconectará a todos los usuarios activos.")
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Centro de Ciberseguridad</h2>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de amenazas, accesos y salud del entorno.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="destructive" onClick={handleForceLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Forzar Cierre Global
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Puntuación de Seguridad
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">92/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 puntos desde la última semana
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estado Base de Datos
            </CardTitle>
            <Database className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Conectada</div>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                Segura
              </Badge>
              <p className="text-xs text-muted-foreground ml-2">Latencia: 12ms</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Variables de Entorno
            </CardTitle>
            <KeyRound className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Protegidas</div>
            <p className="text-xs text-muted-foreground mt-1">
              0 secretos expuestos detectados
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Amenazas Detectadas (24h)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">3</div>
            <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
              2 intentos de fuerza bruta mitigados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-7 lg:grid-cols-7">
        {/* Gráfico Principal */}
        <Card className="col-span-1 md:col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Actividad de Inicios de Sesión</CardTitle>
            <CardDescription>
              Comparativa de accesos exitosos vs fallidos en las últimas 24 horas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loginAttemptsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    className="text-xs" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.5 }}
                  />
                  <YAxis 
                    className="text-xs" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.5 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="success" 
                    name="Exitosos"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorSuccess)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    name="Fallidos"
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorFailed)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Estado */}
        <Card className="col-span-1 md:col-span-3 lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Estado de Componentes</CardTitle>
            <CardDescription>
              Chequeo continuo de infraestructura crítica.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">WAF (Web Application Firewall)</p>
                  <p className="text-sm text-muted-foreground">Activo y filtrando tráfico malicioso.</p>
                </div>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">Online</Badge>
              </div>
              
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                  <KeyRound className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Rotación JWT</p>
                  <p className="text-sm text-muted-foreground">Última rotación hace 2 horas.</p>
                </div>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">Correcto</Badge>
              </div>

              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Sesiones Activas</p>
                  <p className="text-sm text-muted-foreground">42 usuarios conectados ahora.</p>
                </div>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">Normal</Badge>
              </div>

              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center mr-4">
                  <ShieldAlert className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Rate Limiting API</p>
                  <p className="text-sm text-muted-foreground">Bloqueos recientes en /api/auth.</p>
                </div>
                <Badge variant="outline" className="text-orange-500 border-orange-500/50">Alerta</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Auditoría */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Registro de Auditoría y Eventos</CardTitle>
            <CardDescription>
              Historial de las últimas acciones relevantes para la seguridad.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar evento o IP..."
                className="w-full sm:w-[250px] pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Usuario / Origen</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.event}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          log.severity === 'high' 
                            ? "bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400"
                            : log.severity === 'medium'
                            ? "bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 dark:text-orange-400"
                            : "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:text-blue-400"
                        }
                      >
                        {log.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{log.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
