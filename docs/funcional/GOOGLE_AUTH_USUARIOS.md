# Google Auth y gestión de usuarios — Grupo Claver

Aplica a **todas las superficies** del grupo que usan el mismo backend de auth:

- ERP / ClaverP (`/login`, `/login/register`)
- Portal Claver Cliente (`/claver-cliente/login`)
- Cualquier cliente que llame a `POST /api/auth/google` con el mismo JWT

## Métodos de acceso

| Método | Campo DB | Login |
|--------|----------|--------|
| Email + contraseña | `authProvider=credentials`, `password` hash | Formulario |
| Solo Google | `authProvider=google`, `password=null`, `googleId` | Botón Google |
| Híbrido | password + `googleId` | Ambos |

## Flujos

### 1. Dueño se registra con Google

1. Login → Continuar con Google  
2. Si no existe usuario → `EMPRESA_REQUIRED`  
3. Registro pide nombre de empresa  
4. Se crea empresa + usuario `rol=dueno`, `authProvider=google`

### 2. Admin invita subusuario con Google

1. Dashboard → Usuarios → Nuevo → **Solo Google (invitación)**  
   o `POST /api/auth/invite` con `{ authMethod: "google", nombre, email, rol }`  
2. Usuario queda `activo=false` + log `user_invitation`  
3. Invitado usa Continuar con Google con **el mismo email**  
4. Se activa la cuenta y se emite JWT (rol asignado por el admin, no `dueno`)

### 3. Admin crea usuario con contraseña

1. Usuarios → Email y contraseña  
2. o `POST /api/usuarios` / `POST /api/auth/register`  
3. Puede vincular Google después (mismo email verificado)

### 4. Lo que está prohibido

- Unirse a una empresa ajena enviando `empresaId` en `/api/auth/google` (403)  
- Activar un usuario desactivado sin invitación abierta  
- Reset de contraseña en cuentas **solo Google**

## Roles admin

Pueden gestionar usuarios (`canManageUsers`):

- `dueno` (alta Google / roles sistema)
- `administrador` (signup clásico)
- `admin`, `propietario`

## APIs

| Endpoint | Uso |
|----------|-----|
| `POST /api/auth/google` | Login / alta dueño / activar invitación |
| `POST /api/auth/invite` | Invitar credentials o Google |
| `PATCH /api/auth/invite` | Aceptar con password o `idToken` Google |
| `GET/POST /api/usuarios` | Listar / crear |
| `PATCH/PUT/DELETE /api/usuarios/:id` | Editar / soft-delete |
| `GET /api/config/usuarios` | Listado liviano para config |

## Variables de entorno

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Configurar en Vercel/local para cada entorno (demo, staging, producción). El Client ID de GSI debe autorizar los orígenes de todas las instancias Claver.
