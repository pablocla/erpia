# Inversiones Protheus (Claver Edge)

Add-on de tesorería sobre **SIGAFIN**. Protheus sigue siendo el system of record. Claver es el front + REST.

## Login

Mismo usuario Claver (email / Google). Ruta de producto: `/dashboard/protheus`. Sin sesión → `/login?next=/dashboard/protheus`.

## Un cliente = un REST

El implementador carga `restDirectUrl` del tenant en **Claver Cloud → Legacy Bridge** (OpoTenantConfig). El proxy autenticado usa esa URL; las claves no salen al browser.

En Vercel (claver.com.ar) la URL tiene que ser **HTTPS pública** (TOTVS Cloud). Un `http://10.x:8404` de LAN no llega al servidor.

## Campos

- **Reusar loc. Argentina:** SA6, SED, SE5 (FINA100), SA1 CUIT, SM2.
- **Crear:** Z01 (tipos), Z02 (operación), Z03 (valuación diaria).

## Compilar

`FINZINV.PRW` → `FINZRES.PRW` → `CLVINV01.PRW` → `JOBFINZ03.PRW`  
Health: `GET {rest}/api/claver/v1/investments/health`
