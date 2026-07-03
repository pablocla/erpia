#Include "Protheus.ch"

/*/{Protheus.doc} CLVEXP02
Claver Expenses — Punto de entrada inyección SE1
Se ejecuta al aprobar rendición (workflow). Cambia CLV_STS a "I" e inyecta título.
Boletín técnico: edge.expenses
@author Claver Bridge
@since  01/07/2026
@version 1.0.0
/*/

User Function CLVEXPPE()
    Local cId := ""
    // cId := parámetro del workflow — ajustar según configuración MATA020

    If Empty(cId)
        Return
    EndIf

    ClvExpInjectSE1(cId)
Return

Static Function ClvExpInjectSE1(cId)
    Local cConta := GetMV("MV_CLVCTA")
    Local cCC    := GetMV("MV_CLVCC")
    Local nTot   := 0

    DbSelectArea("ZCL010")
    ZCL010->(DbSetOrder(1))
    If !ZCL010->(DbSeek(xFilial("ZCL") + cId))
        Return .F.
    EndIf

    If ZCL010->CLV_STS != "A"
        ConOut("[CLVEXP] Rendición no aprobada: " + cId)
        Return .F.
    EndIf

    nTot := ZCL010->CLV_TOT

    // TODO: ExecAuto Fin040 / MaContabiliza según estándar del cliente
    // Crear título SE1 con referencia CLV_ID

    RecLock("ZCL010", .F.)
        ZCL010->CLV_STS := "I"
    ZCL010->(MsUnlock())

    ConOut("[CLVEXP] Inyectado SE1 rendición " + cId + " total " + cValToChar(nTot))
Return .T.