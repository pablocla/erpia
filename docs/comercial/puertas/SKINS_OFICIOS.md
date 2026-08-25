# Skins de Oficios — Un Solo SKU (`niche.oficios`), Múltiples Rubros (P-OFI-*)

> **Tesis:** No crear 10 SKUs ni bifurcar código.  
> Un único motor de presupuestos de obra, certificados y cuadrilla (`niche.oficios`), con copy adaptado según el oficio (`?oficio=`).

---

## 1. Tabla de Mapeo de Skins de Oficios

| Skin (`?oficio=`) | Rubro / Título | H1 Principal | 3 Dolores Específicos | Keyword SEO Primaria |
|---|---|---|---|---|
| `electricista` | Electricista / Instalador | Dejá de perder plata en presupuestos eléctricos que no se cobran. | Comprar térmicas y cables sin seña · Adicionales de bocas no cobrados · Competir con presupuestos informales. | `presupuesto electricista argentina` |
| `plomero` | Plomero / Gasista / Sanitarista | Presupuestá instalaciones y arreglos sanitarios con seña previa garantizada. | Comprar caños y griferías con plata propia · Destapes y urgencias no valorizadas · Presupuestos discutidos. | `presupuesto plomero gasista` |
| `pintor` | Pintor de Obra & Reformas | Calculá mano de obra y materiales por m² y cobrá por etapas de avance. | Clientes que cambian de color o piden más manos sin pagar · Comprar baldes de látex sin seña · Jornales de ayudantes. | `presupuesto pintor obra m2` |
| `herrero` | Herrería & Estructuras Metálicas | Presupuestá rejas, portones y tinglados asegurando el costo del hierro. | La inflación del hierro te come el margen · Clientes que cancelan con el portón a medio armar · Fletes y colocación. | `presupuesto herreria portones` |
| `estudio` | Arquitecto / Maestro Mayor de Obras | Certificá avances de obra particular, cobrá por hitos y controlá a la cuadrilla. | Adicionales de obra no firmados · Planillas de jornales desordenadas · Comitentes que demoran pagos de certificados. | `software gestion obra particular arquitectos` |

---

## 2. Implementación Técnica en Código (Spec para Grok)

En la landing de `/claver/apps/oficios/page.tsx`:
- Leer el parámetro de búsqueda `searchParams.oficio`.
- Interpolar el objeto de diccionario `SKIN_OFICIOS[oficio ?? "general"]` para renderizar el H1, subtítulo, dolores y testimonios sin modificar el backend ni la ruta de login `/login?activar=niche.oficios`.
