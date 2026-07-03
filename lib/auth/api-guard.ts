/**
 * Guard multi-tenant — punto de entrada para rutas API del ERP.
 *
 * ⚠️ NO usar NextAuth ni `getToken` de `next-auth/jwt`.
 * Auth real: JWT firmado con jose (`lib/auth/auth-service.ts`), Bearer en
 * `Authorization: Bearer <token>`, validado por `verificarToken` (middleware API).
 *
 * Uso canónico:
 *
 * ```ts
 * import { withAuthAndTenant, whereEmpresa, zodErrorResponse } from "@/lib/auth/api-guard"
 *
 * export const GET = withAuthAndTenant(async (req, auth) => {
 *   const rows = await prisma.cliente.findMany({ where: whereEmpresa(auth.empresaId) })
 *   return NextResponse.json(rows)
 * })
 *
 * // Rutas dinámicas App Router (params es Promise en Next 15):
 * export const GET = withAuthAndTenant<{ id: string }>(async (req, auth, ctx) => {
 *   const { id } = await ctx.params!
 *   // ...
 * })
 * ```
 *
 * Implementación: `lib/auth/empresa-guard.ts`
 */
export {
  withAuthAndTenant,
  getAuthContext,
  whereEmpresa,
  verificarPropietario,
  zodErrorResponse,
  type AuthContext,
  type AuthenticatedContext,
  type AuthedRouteHandler,
  type RouteContext,
  type WithAuthOptions,
} from "@/lib/auth/empresa-guard"