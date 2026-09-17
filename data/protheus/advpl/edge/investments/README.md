# Claver Inversiones — fuentes Protheus (`edge.investments`)

Orden de compilación TDS (RPO del AppServer):

1. `FINZINV.PRW` — MVC Z02/Z03 + commit FINA100 (ND al alta)
2. `FINZRES.PRW` — rescate (NC capital + NC/ND interés)
3. `CLVINV01.PRW` — REST que consume `/claver/protheus`
4. `JOBFINZ03.PRW` — schedule valuación diaria Z03

Antes: crear Z01 / Z02 / Z03 en Configurador (SX2/SX3/SIX/SX9) según el Excel de alineamientos. Parametrizar `MV_CLVINV=.T.` y `[HTTPREST]` en `appserver.ini`.

REST base (ejemplo): `http://SERVIDOR:8404/rest/api/claver/v1/investments/health`
