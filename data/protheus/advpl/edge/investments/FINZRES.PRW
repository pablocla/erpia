#include 'protheus.ch'

/*/{Protheus.doc} FINZRES
Rescate de inversion (Z02): pide monto acreditado, separa capital e interes
y genera NC (o ND de perdida) via ExecAuto FINA100. Nunca INSERT a SE5.

Llamada desde MenuDef de FINZINV (OPERATION 6) con Z02 posicionado.
@author Claver / partner TOTVS
@since  17/09/2026
@version 1.1.0
/*/
User Function FINZRES()
    Local aParamBox := {}
    Local aRet      := {}
    Local nValTotal := 0
    Local nCapital  := 0
    Local nInteres  := 0
    Local dDataRes  := dDataBase
    Local cNatCap   := "INV001"
    Local cNatInt   := "INT001"

    If Select("Z02") == 0 .Or. Z02->(Eof())
        MsgStop("Posicione una inversion (Z02) antes de rescatar.", "FINZRES")
        Return .F.
    EndIf

    If AllTrim(Z02->Z02_STATUS) == "2"
        MsgStop("Esta inversion ya se encuentra rescatada.", "Atencion")
        Return .F.
    EndIf

    nCapital  := Z02->Z02_CAPINI
    nValTotal := ClvInvLastMtm(Z02->Z02_NUMERO, nCapital)

    aAdd(aParamBox, {1, "Fecha de Rescate", dDataRes, "", "", "", "", 50, .T.})
    aAdd(aParamBox, {3, "Monto Total Acreditado", nValTotal, "@E 999,999,999.99", "", "", "", 50, .T.})

    If !ParamBox(aParamBox, "Confirmar Rescate de Inversion", @aRet)
        Return .F.
    EndIf

    dDataRes  := aRet[1]
    nValTotal := aRet[2]
    nInteres  := nValTotal - nCapital

    DbSelectArea("Z01")
    Z01->(DbSetOrder(1))
    If Z01->(DbSeek(xFilial("Z01") + Z02->Z02_TIPO))
        cNatCap := AllTrim(Z01->Z01_NATCAP)
        cNatInt := AllTrim(Z01->Z01_NATINT)
    EndIf

    Begin Transaction
        RecLock("Z02", .F.)
        Z02->Z02_STATUS := "2"
        MsUnlock()

        If nCapital > 0
            If !ClvInvFinMov(dDataRes, nCapital, "NC", cNatCap, "Rescate capital " + AllTrim(Z02->Z02_TICKER))
                DisarmTransaction()
                Return .F.
            EndIf
        EndIf

        If nInteres > 0
            If !ClvInvFinMov(dDataRes, nInteres, "NC", cNatInt, "Intereses " + AllTrim(Z02->Z02_TICKER))
                DisarmTransaction()
                Return .F.
            EndIf
        ElseIf nInteres < 0
            If !ClvInvFinMov(dDataRes, Abs(nInteres), "ND", cNatInt, "Perdida financiera " + AllTrim(Z02->Z02_TICKER))
                DisarmTransaction()
                Return .F.
            EndIf
        EndIf

        MsgInfo("Rescate procesado. Movimientos FINA100 en SA6 " + AllTrim(Z02->Z02_BANCO) + ".", "Exito")
    End Transaction
Return .T.

Static Function ClvInvLastMtm(cNumero, nFallback)
    Local nVal := nFallback
    DbSelectArea("Z03")
    Z03->(DbSetOrder(1))
    If Z03->(DbSeek(xFilial("Z03") + cNumero))
        While !Z03->(Eof()) .And. Z03->Z03_FILIAL == xFilial("Z03") .And. Z03->Z03_NUMERO == cNumero
            nVal := Z03->Z03_VALOR
            Z03->(DbSkip())
        EndDo
    EndIf
Return nVal

Static Function ClvInvFinMov(dData, nValor, cTipo, cNatureza, cHistoria)
    Local aAutoFIN := {}
    Private lMsErroAuto := .F.

    aAdd(aAutoFIN, {"E5_DATA",    dData, Nil})
    aAdd(aAutoFIN, {"E5_TIPO",    cTipo, Nil})
    aAdd(aAutoFIN, {"E5_MOEDA",   Z02->Z02_MOEDA, Nil})
    aAdd(aAutoFIN, {"E5_VALOR",   nValor, Nil})
    aAdd(aAutoFIN, {"E5_NATUREZ", cNatureza, Nil})
    aAdd(aAutoFIN, {"E5_BANCO",   Z02->Z02_BANCO, Nil})
    aAdd(aAutoFIN, {"E5_AGENCIA", Z02->Z02_AGENCI, Nil})
    aAdd(aAutoFIN, {"E5_CONTA",   Z02->Z02_CUENTA, Nil})
    aAdd(aAutoFIN, {"E5_HISTOR",  cHistoria, Nil})

    MSExecAuto({|x, y| FINA100(x, y)}, 0, aAutoFIN, 3)

    If lMsErroAuto
        MostraErro()
        Return .F.
    EndIf
Return .T.
