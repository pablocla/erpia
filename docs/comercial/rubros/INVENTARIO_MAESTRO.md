# Inventario Maestro de Rubros y Nichos

## Cobertura 100%
- [x] ≥ 45 industryId listados
- [x] 22 appId nicho listados
- [x] Rubros onboarding extras listados
- [x] ≥ 10 oficios sin template listados
- [x] Ninguna fila sin motor o "N/A justificado"
- [x] Sección "huecos de catálogo" si encontrás id huérfano

## 1. Industry Templates (Templates principales)

| ID / IndustryId | Tipo | % Hoy | Meta | Tier | Motor | $ | Alias / Notas |
|-----------------|------|------:|-----:|------|-------|:--|---------------|
| almacen | template | 88 | 92 | 🟢 | M-FIADO+M-POS | ★★ | |
| kiosco | template | 86 | 90 | 🟢 | M-FIADO+M-POS | ★★ | |
| ferreteria | template | 78 | 85 | 🟢 | M-POS+M-CXC | ★★ | |
| carniceria | template | 58 | 72 | 🟡 | M-POS | ★★ | |
| panaderia | template | 70 | 82 | 🟡 | M-FIADO+M-POS | ★★ | |
| supermercado | template | 55 | 68 | 🟠 | M-POS | ★★ | |
| feria_puesto | template | 35 | 55 | 🟠 | M-MOV | ★★ | |
| otro | template | 50 | 60 | 🟠 | M-POS | ★ | |
| veterinaria | template | 52 | 68 | 🟡 | M-HC+AGENDA+POS | ★★★ | |
| vet_barrio | template | 52 | 68 | 🟡 | 🔵 veterinaria | ★★★ | Alias veterinaria |
| clinica | template | 52 | 65 | 🟡 | M-AGENDA+HC | ★★★ | |
| consultorio_solo | template | 55 | 70 | 🟡 | M-AGENDA | ★★★ | |
| farmacia | template | 48 | 62 | 🟠 | M-POS | ★★ | |
| gimnasio | template | 58 | 75 | 🟢* | M-CUOTAS | ★★★ | |
| gimnasio_barrio | template | 55 | 75 | 🟢* | 🔵 gym | ★★★ | Alias gym |
| salon_belleza | template | 48 | 70 | 🟠 | M-AGENDA | ★★ | |
| peluqueria_barrio | template | 40 | 70 | 🟠 | M-AGENDA | ★★ | |
| freelance_mt | template | 72 | 82 | 🟢 | M-PRESUP | ★★ | |
| servicios_pro | template | 68 | 78 | 🟢 | M-AGENDA+PRESUP | ★★ | |
| fumigacion | template | 60 | 75 | 🟡 | M-FUMI | ★★★ | |
| club_barrio | template | 55 | 72 | 🟢* | M-CUOTAS | ★★★ | |
| tintoreria | template | 45 | 70 | 🟠 | M-MOV | ★★★ | |
| cooperativa_cuotas | template | 38 | 65 | 🟠 | M-CUOTAS | ★★ | |
| escuela_barrio | template | 38 | 65 | 🟠 | M-CUOTAS | ★★★ | |
| cancha_barrio | template | 32 | 70 | 🟠 | M-AGENDA | ★★★ | |
| colonia_verano | template | 35 | 62 | 🟠 | M-CUOTAS | ★★★ | |
| salon_eventos | template | 38 | 65 | 🟠 | M-MOV+CXC | ★★★ | |
| pena_folklore | template | 35 | 60 | 🟠 | M-CUOTAS | ★★ | |
| bar_restaurant | template | 48 | 65 | 🟡 | M-HOSP | ★★ | |
| estacion_servicio | template | 40 | 58 | 🟠 | M-CXC+POS | ★★ | |
| distribuidora | template | 50 | 68 | 🟡 | M-PICK | ★★★ | |
| base_remis | template | 35 | 60 | 🟠 | M-MOV | ★★★ | |
| delivery_barrio | template | 35 | 58 | 🟠 | M-MOV | ★★ | |
| agro_acopio | template | 38 | 55 | 🟠 | M-AGRO | ★★★ | |
| acopio_grano | template | 35 | 55 | 🟠 | M-MOV+AGRO | ★★★ | |
| agro_cannabis | template | 30 | 45 | 🟠 | M-AGRO | ★★ | |
| prestamista | template | 88 | 92 | 🟡 | M-PRESTAMO | ★★★ | |
| contratista_obra | template | 42 | 62 | 🟠 | M-MOV+CXC | ★★★ | |
| obra_changas | template | 38 | 62 | 🟠 | 🔵 obras | ★★★ | Alias obras |
| inmobiliaria | template | 72 | 80 | 🟡 | M-CONSORCIO+INMO | ★★★ | |
| consorcios_admin | template | 82 | 88 | 🟡 | M-CONSORCIO | ★★★ | |
| inmo_garantia | template | 45 | 70 | 🟠 | M-INMO | ★★ | |
| taller_mecanico | template | 40 | 68 | 🟡 | M-MOV | ★★★ | |
| concesionaria | template | 28 | 45 | 🔴 | shell | ★★ | |
| quimica | template | 32 | 45 | 🔴 | M-INDUSTRIA | ★ | |

## 2. Niche Apps (appId)

| ID / appId | Tipo | % Hoy | Meta | Tier | Motor | $ | Alias / Notas |
|------------|------|------:|-----:|------|-------|:--|---------------|
| consorcios | niche | 82 | 88 | 🟡 | consorcio | ★★★ | |
| club | niche | 55 | 72 | 🟢* | cuotas | ★★★ | |
| feria | niche | 35 | 55 | 🟠 | mov | ★★ | |
| prestamista | niche | 88 | 92 | 🟡 | libreta/préstamo| ★★★ | |
| obras | niche | 38 | 62 | 🟠 | mov | ★★★ | |
| acopio | niche | 35 | 55 | 🟠 | mov | ★★★ | |
| remis | niche | 35 | 60 | 🟠 | mov | ★★★ | |
| plancha | niche | 45 | 70 | 🟠 | mov | ★★★ | |
| consultorio | niche | 55 | 70 | 🟡 | agenda | ★★★ | |
| garantia | niche | 45 | 70 | 🟠 | inmo | ★★ | |
| mutuo | niche | 38 | 65 | 🟠 | cuotas | ★★ | |
| escuela | niche | 38 | 65 | 🟠 | cuotas | ★★★ | |
| cancha | niche | 32 | 70 | 🟠 | agenda | ★★★ | |
| taller | niche | 40 | 68 | 🟡 | mov | ★★★ | |
| fumigacion | niche | 60 | 75 | 🟡 | fumi | ★★★ | |
| delivery | niche | 35 | 58 | 🟠 | mov | ★★ | |
| peluqueria | niche | 40 | 70 | 🟠 | agenda | ★★ | |
| gimnasio | niche | 55 | 75 | 🟢* | cuotas | ★★★ | |
| colonia | niche | 35 | 62 | 🟠 | cuotas | ★★★ | |
| salon | niche | 38 | 65 | 🟠 | mov | ★★★ | |
| veterinaria | niche | 52 | 68 | 🟡 | HC | ★★★ | |
| pena | niche | 35 | 60 | 🟠 | cuotas | ★★ | |

## 3. Rubros onboarding (sin template propio)

| Rubro | Tipo | % Hoy | Meta | Tier | Motor | $ | Alias / Notas |
|-------|------|------:|-----:|------|-------|:--|---------------|
| libreria | rubro | 45 | 62 | 🟠 | M-POS | ★ | |
| ropa | rubro | 48 | 65 | 🟠 | M-POS | ★★ | |
| importador | rubro | 25 | 40 | 🔴 | M-POS+CxP | ★★ | |
| reventa_tendencias | rubro | 30 | 50 | 🟠 | M-POS | ★ | |
| textil_fabrica | rubro | 28 | 42 | 🔴 | M-INDUSTRIA | ★ | |
| canchas | rubro | 32 | 70 | 🟠 | 🔵 cancha_barrio | ★★★ | Alias cancha_barrio |
| servicios | rubro | 68 | 78 | 🟢 | M-AGENDA | ★★ | |

## 4. Oficios radar (sin template)

| Oficio | Tipo | % Hoy | Meta | Tier | Motor | $ | Alias / Notas |
|--------|------|------:|-----:|------|-------|:--|---------------|
| AC / clima | oficio | 20 | 55 | ⚫ | M-OT-FIELD | ★★★ | Meta estimada (R4) |
| Electricista | oficio | 18 | 55 | ⚫ | M-OT-FIELD | ★★★ | Meta estimada (R4) |
| Gasista | oficio | 18 | 55 | ⚫ | M-OT-FIELD | ★★★ | Meta estimada (R4) |
| Plomería | oficio | 18 | 55 | ⚫ | M-OT-FIELD | ★★★ | Meta estimada (R4) |
| Piletero | oficio | 15 | 55 | ⚫ | M-OT-FIELD | ★★ | Meta estimada (R4) |
| Jardinería | oficio | 15 | 55 | ⚫ | M-OT-FIELD | ★★ | Meta estimada (R4) |
| Limpieza empresas | oficio | 22 | 55 | ⚫ | agenda+CxC | ★★★ | Meta estimada (R4) |
| ST celulares | oficio | 25 | 55 | ⚫ | M-MOV | ★★ | Meta estimada (R4) |
| Gomería | oficio | 25 | 55 | ⚫ | M-MOV+POS | ★★ | Meta estimada (R4) |
| PT / nutricionista | oficio | 40 | 55 | ⚫ | agenda+packs | ★★ | Meta estimada (R4) |
| Tatuador | oficio | 30 | 55 | ⚫ | agenda+seña | ★★ | Meta estimada (R4) |

## 5. Huecos de catálogo
- Todos los IDs tienen asignado su correspondiente motor y tier (N/A).
- Los oficios carecen de template propio y requerirán `M-OT-FIELD` y `M-MOV`.

### Cierre ticket RUB-00
- Estado: DONE
- Archivo(s) creado(s): `docs/comercial/rubros/INVENTARIO_MAESTRO.md`
- Resultado esperado: checklist con ✅
- Siguiente ticket recomendado: RUB-01
- Si es pair: N/A
