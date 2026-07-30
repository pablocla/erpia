# Playbook Operativo: Piloto Go-Live Fumigación (Empresa de Control de Plagas)

> Documento de puesta en marcha para el piloto real de la dueña de la empresa de fumigaciones (usuario no técnico, 50-55 años).

---

## 1. Objetivo del Piloto Real
Permitir que la dueña y sus fumigadores utilicen el monorepo ERP Claver en producción real para:
1. **Cargar clientes** con sus direcciones y teléfonos.
2. **Armar la hoja de ruta del día** para los fumigadores.
3. **Ver las paradas en un mapa gratis** (OpenStreetMap + MapLibre) sin costos de API de Google.
4. **Abrir navegación en el celular** con 1 solo toque en el botón **"Cómo llegar"** (Google Maps / Waze).
5. **Cambiar estado de las visitas** (*Pendiente* → *En camino* → *Tratado*).
6. **Cobrar y facturar abonos mensuales** de mantenimiento.
7. **Pasar a Modo Claro** con un toque en el botón de **Sol ☀️ / Luna 🌙** de la barra superior.

---

## 2. Pasos para Dar de Alta a la Dueña (Provisioning)

### Opción A: Script Automático (Recomendado)
Ejecutar desde la terminal en el servidor o entorno local:

```bash
npx tsx scripts/provision-fumigacion-piloto.ts --email=EMAIL_REAL_DE_LA_MADRE@DOMINIO.COM --nombre="Fumigaciones San Martín" --nombreUsuario="Nombre de la Madre"
```

El script se encarga automáticamente de:
1. Crear o actualizar la empresa con `demoIndustryId: "fumigacion"`, `modoLite: "niche"`, `rubro: "otro"`.
2. Activar el SKU `niche.fumigacion`.
3. Crear el usuario con rol `dueno` e imprimir una clave temporal aleatoria.
4. Inyectar clientes demo iniciales con coordenadas reales en Argentina para probar el mapa de inmediato.

### Opción B: Alta Manual desde Claver Cloud / Dashboard
1. Ir a `/claver-cloud` o `/dashboard/usuarios`.
2. Crear la empresa con rubro `Fumigación / control de plagas`.
3. Invitar/crear usuario con el correo de la madre y asignar rol `dueño` o `administrador`.
4. Si la dueña usa Gmail, puede ingresar mediante el botón **"Continuar con Google"**.

---

## 3. Checklist de Primer Uso para la Dueña

Acompañar a la usuaria en su primera sesión completando la siguiente lista:

- [ ] **1. Iniciar sesión**: Ingresar en el sistema con su correo y contraseña (o Google login).
- [ ] **2. Modo Claro**: Si la pantalla se siente muy oscura, tocar el botón **Sol ☀️** arriba a la derecha para activar la pantalla blanca.
- [ ] **3. Cargar 5 Clientes**: Ir a **Clientes** (`/dashboard/clientes`) e ingresar nombre, teléfono y la **dirección completa** (ej: *Av. Pellegrini 1400, Rosario*).
- [ ] **4. Crear 3 Visitas para Hoy**: En la pantalla de **Fumigación** (`/dashboard/fumigacion`), tocar el botón grande **+ Nueva visita**, elegir cliente, plaga a tratar y dejar la fecha de hoy.
- [ ] **5. Ver la Hoja de Ruta en el Mapa**: Verificar que las visitas aparezcan numeradas (1, 2, 3) en el mapa de paradas.
- [ ] **6. Abrir navegación en el celular**: Tocar **"Cómo llegar"** en una parada y confirmar que abra Google Maps en el celular.
- [ ] **7. Marcar Visita Tratada**: Pasar una parada a estado *En camino* y luego a *Tratado*.
- [ ] **8. Facturar Abono**: Probar la emisión del comprobante desde la pestaña de **Facturación** (`/dashboard/ventas`).

---

## 4. Alcance y Lo que NO Prometer

### Lo que SÍ incluye el piloto:
- Mapa gratis sin límite de consultas.
- Hoja de ruta interactiva con reordenamiento (subir/bajar paradas).
- Enlace directo a Google Maps y Waze desde celular/tablet.
- Facturación AFIP (A/B/C) y seguimiento de cobranzas.
- Modo claro / oscuro instantáneo.

### Lo que NO prometer en esta fase:
- Certificados oficiales SENASA / MSDS avanzados de químicos.
- Algoritmo de optimización matemáticamente perfecto (TSP).
- Funcionamiento 100% offline en zonas de nula cobertura (requiere internet).
- Integración con dispositivos IoT o trampas electrónicas.
