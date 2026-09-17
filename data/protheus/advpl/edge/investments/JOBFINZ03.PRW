#include 'protheus.ch'
#include 'topconn.ch'

/*/{Protheus.doc} JOBFINZ03
Job FWSchedule (ej. 18:30): valuacion diaria Z03.
- Renta fija (Z01_TIPO='F' o Z01_USAAPI='2'): devenga TNA sobre Z02_CAPINI.
- Renta variable (Z01_USAAPI='1'): deja rastro; el precio de mercado lo
  completa un conector (PPI / Claver cron) via POST REST o este job
  cuando MV_PPIURL este cargado.

No toca SE5.
@author Claver / partner TOTVS
@since  17/09/2026
@version 1.0.0
/*/
User Function JOBFINZ03()
    Local nIns := 0
    RpcSetEnv(cEmpAnt, cFilAnt)
    nIns := ClvInvRunZ03(dDataBase)
    ConOut("[JOBFINZ03] filas Z03 upsert=" + cValToChar(nIns))
Return nIns

Static Function ClvInvRunZ03(dRef)
    Local nIns := 0
    Local nValor := 0
    Local nPrecio := 0
    Local nPrev := 0
    Local nDays := 0
    Local cOri := "C"

    Default dRef := dDataBase

    DbSelectArea("Z02")
    Z02->(DbSetOrder(1))
    Z02->(DbGoTop())
    While !Z02->(Eof())
        If Z02->Z02_FILIAL == xFilial("Z02") .And. AllTrim(Z02->Z02_STATUS) == "1"
            DbSelectArea("Z01")
            Z01->(DbSetOrder(1))
            If Z01->(DbSeek(xFilial("Z01") + Z02->Z02_TIPO))
                nPrev := Z02->Z02_CAPINI
                nPrev := ClvInvPrevValor(Z02->Z02_NUMERO, nPrev)
                If AllTrim(Z01->Z01_TIPO) == "F" .Or. AllTrim(Z01->Z01_USAAPI) <> "1"
                    nDays := Max(0, dRef - Z02->Z02_DTINV)
                    nValor := Z02->Z02_CAPINI * (1 + (Z02->Z02_TASA / 100) * (nDays / 365))
                    nPrecio := IIf(Z02->Z02_CANTID == 1, nValor, nValor / Max(Z02->Z02_CANTID, 1))
                    cOri := "C"
                    ClvInvUpsertZ03(Z02->Z02_NUMERO, dRef, nPrecio, nValor, nValor - nPrev, cOri)
                    nIns++
                Else
                    ConOut("[JOBFINZ03] " + AllTrim(Z02->Z02_TICKER) + " espera API (Z01_USAAPI=1)")
                EndIf
            EndIf
            DbSelectArea("Z02")
        EndIf
        Z02->(DbSkip())
    EndDo
Return nIns

Static Function ClvInvPrevValor(cNum, nFallback)
    Local nVal := nFallback
    DbSelectArea("Z03")
    Z03->(DbSetOrder(1))
    If Z03->(DbSeek(xFilial("Z03") + cNum))
        While !Z03->(Eof()) .And. Z03->Z03_FILIAL == xFilial("Z03") .And. Z03->Z03_NUMERO == cNum
            nVal := Z03->Z03_VALOR
            Z03->(DbSkip())
        EndDo
    EndIf
Return nVal

Static Function ClvInvUpsertZ03(cNum, dRef, nPrecio, nValor, nRto, cOri)
    DbSelectArea("Z03")
    Z03->(DbSetOrder(1))
    If Z03->(DbSeek(xFilial("Z03") + cNum + DToS(dRef)))
        RecLock("Z03", .F.)
    Else
        RecLock("Z03", .T.)
        Z03->Z03_FILIAL := xFilial("Z03")
        Z03->Z03_NUMERO := cNum
        Z03->Z03_FECHA  := dRef
    EndIf
    Z03->Z03_PRECIO := nPrecio
    Z03->Z03_VALOR  := nValor
    Z03->Z03_RENDIM := nRto
    Z03->Z03_ORIGEN := cOri
    MsUnlock()
Return .T.
