# AGENTS.md — ERP Argentina AI Composition Guide

> This file helps AI assistants (Copilot, Cursor, etc.) understand the project
> structure and generate correct code for this ERP system.

## Tech Stack
- **Framework**: Next.js 15, App Router, TypeScript strict
- **UI**: Tailwind CSS v4, shadcn/ui (New York style), Framer Motion
- **State**: Zustand (auth, caja/POS, UI preferences) + SWR for server state
- **Auth**: JWT via jose, middleware-validated, Zustand `useAuthStore`
- **DB**: Prisma ORM → PostgreSQL (Supabase)
- **Testing**: Vitest (unit + service tests)
- **Fonts**: Manrope (sans), Fraunces (serif display), Geist Mono (code)
- **Color**: OKLCH color space with 10+ theme palettes

## Architecture Patterns

### File Structure
```
app/api/{module}/route.ts    → API routes (GET/POST/PUT/DELETE)
app/dashboard/{module}/page.tsx → Dashboard pages (client components)
lib/{module}/                → Business logic services
lib/stores/                  → Zustand stores (auth, caja, ui)
hooks/                       → Custom React hooks
components/ui/               → shadcn primitives
components/                  → Composite components
prisma/schema.prisma         → Database schema
__tests__/                   → Vitest test files
```

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  
  const data = await prisma.model.findMany({
    where: whereEmpresa(auth.auth.empresaId),
  })
  return NextResponse.json(data)
}
```

### Page Pattern (Dashboard)
```typescript
"use client"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"

export default function ModulePage() {
  const { data, error, isLoading, mutate } = useAuthFetch<Type[]>("/api/module")
  
  async function handleCreate(payload: CreateDTO) {
    const res = await authFetch("/api/module", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (res.ok) mutate()
  }
  // ...
}
```

### Zustand Store Usage
```typescript
import { useAuthStore, getToken, authFetch } from "@/lib/stores"
import { useCajaStore } from "@/lib/stores"
import { useUIStore } from "@/lib/stores"

// In components:
const token = useAuthStore(s => s.token)
const { addItem, getTotal } = useCajaStore()
const { commandPaletteOpen, toggleCommandPalette } = useUIStore()

// Outside components:
const token = getToken() 
await authFetch("/api/endpoint", { method: "POST", body: JSON.stringify(data) })
```

### Multi-Tenant Security
Every API route MUST use `getAuthContext()` + `whereEmpresa()` to scope data by empresa.
Never return data without filtering by `empresaId`.

### Component Style
- Use shadcn/ui primitives from `@/components/ui/`
- Use `cn()` from `@/lib/utils` for conditional classes
- Use OKLCH CSS variables: `var(--primary)`, `var(--background)`, etc.
- Use Tailwind v4 native CSS nesting and `@custom-variant dark`

### Key Conventions
- Locale: es-AR (Spanish Argentina)
- Currency: ARS (peso argentino) with Intl.NumberFormat
- Tax: IVA 21%, with AFIP electronic invoicing
- CUIT format: XX-XXXXXXXX-X
- All dates in ISO format, displayed in dd/mm/yyyy

## Modules (40+)
Ventas, Compras, Stock, Caja, Banco, Contabilidad, Impuestos (IVA/IIBB/TES),
Hospitalidad (KDS/Mesas/Platos), Logística, Industria, Picking, IoT,
Agenda, Historia Clínica, Membresías, Veterinaria, Portal B2B,
App Vendedor en Ruta, Onboarding IA, Asistente IA, Soporte, Auditoría
