#Include "Protheus.ch"
#Include "Restful.ch"
#Include "FWMVCDEF.ch"

/*/{Protheus.doc} CLVEXP01
Claver Expenses — REST API v1
Expone alta y consulta de rendiciones de gastos (tablas ZCL010/ZCL011).
Compilar en TDS, actualizar RPO y reiniciar AppServer.
Ver boletín técnico: edge.expenses
@author Claver Bridge
@since  01/07/2026
@version 1.0.0
/*/

WSRESTFUL CLVEXP01 DESCRIPTION "Claver Expenses API v1" FORMAT APPLICATION_JSON

    WSMETHOD POST ;
        DESCRIPTION "Crea rendición de gastos" ;
        WSSYNTAX "/api/claver/v1/expenses" ;
        PATH "/api/claver/v1/expenses" ;
        PRODUCES APPLICATION_JSON ;
        Consumes APPLICATION_JSON

    WSMETHOD GET ;
        DESCRIPTION "Consulta rendición por ID" ;
        WSSYNTAX "/api/claver/v1/expenses/{id}" ;
        PATH "/api/claver/v1/expenses/{id}" ;
        PRODUCES APPLICATION_JSON

END WSRESTFUL

/*====================================================================
  POST — Alta rendición
====================================================================*/
WSMETHOD POST WSSERVICE CLVEXP01
    Local oJson    := JsonObject():New()
    Local oBody    := JsonObject():New()
    Local oResp    := JsonObject():New()
    Local cId      := ""
    Local cEmp     := ""
    Local nTot     := 0
    Local aItems   := {}
    Local nI       := 0
    Local oItem    := Nil

    If !ClvExpIsActive()
        ClvExpSetError(oResp, "MV_CLVEXP desactivado", 503)
        Return .F.
    EndIf

    oBody:FromJson(Self:GetContent())

    cEmp := oBody["empleadoId"]
    If Empty(cEmp)
        ClvExpSetError(oResp, "empleadoId requerido", 400)
        Return .F.
    EndIf

    If !ClvExpEmpExists(cEmp)
        ClvExpSetError(oResp, "Empleado no encontrado: " + cEmp, 404)
        Return .F.
    EndIf

    aItems := oBody["items"]
    If ValType(aItems) != "A" .Or. Len(aItems) == 0
        ClvExpSetError(oResp, "items requerido (array no vacío)", 400)
        Return .F.
    EndIf

    cId  := ClvExpNewId()
    nTot := ClvExpCalcTotal(aItems)

    DbSelectArea("ZCL010")
    ZCL010->(DbSetOrder(1))
    RecLock("ZCL010", .T.)
        ZCL010->CLV_ID  := cId
        ZCL010->CLV_EMP := cEmp
        ZCL010->CLV_STS := "P"
        ZCL010->CLV_TOT := nTot
    ZCL010->(MsUnlock())

    For nI := 1 To Len(aItems)
        oItem := aItems[nI]
        ClvExpAddLine(cId, nI, oItem)
    Next nI

    oResp["id"]           := cId
    oResp["estado"]       := "P"
    oResp["numeroLegacy"] := cId
    oResp["total"]        := nTot

    Self:SetResponse(oResp:ToJson())
Return .T.

/*====================================================================
  GET — Consulta rendición
====================================================================*/
WSMETHOD GET WSSERVICE CLVEXP01
    Local oResp := JsonObject():New()
    Local cId   := Self:GetPathParam("id")

    If Empty(cId)
        ClvExpSetError(oResp, "id requerido", 400)
        Return .F.
    EndIf

    If !ClvExpLoad(cId, oResp)
        ClvExpSetError(oResp, "Rendición no encontrada", 404)
        Return .F.
    EndIf

    Self:SetResponse(oResp:ToJson())
Return .T.

/*====================================================================
  Funciones auxiliares — implementar según diccionario del cliente
====================================================================*/
Static Function ClvExpIsActive()
Return GetMV("MV_CLVEXP") == .T.

Static Function ClvExpNewId()
Return "CLV-" + FWTimeStamp(3)

Static Function ClvExpEmpExists(cEmp)
    // TODO: validar contra SRA/RA_EMPLOYEE del cliente
Return !Empty(cEmp)

Static Function ClvExpCalcTotal(aItems)
    Local nTot := 0
    Local nI   := 0
    For nI := 1 To Len(aItems)
        nTot += aItems[nI]["monto"]
    Next
Return nTot

Static Function ClvExpAddLine(cId, nLin, oItem)
    DbSelectArea("ZCL011")
    RecLock("ZCL011", .T.)
        ZCL011->CLV_ID  := cId
        ZCL011->CLV_LIN := nLin
        ZCL011->CLV_CON := oItem["concepto"]
        ZCL011->CLV_VAL := oItem["monto"]
        ZCL011->CLV_URL := oItem["adjuntoUrl"]
    ZCL011->(MsUnlock())
Return

Static Function ClvExpLoad(cId, oResp)
    Local aLines := {}
    Local oLine  := Nil

    DbSelectArea("ZCL010")
    ZCL010->(DbSetOrder(1))
    If !ZCL010->(DbSeek(xFilial("ZCL") + cId))
        Return .F.
    EndIf

    oResp["id"]     := ZCL010->CLV_ID
    oResp["estado"] := ZCL010->CLV_STS
    oResp["total"]  := ZCL010->CLV_TOT

    DbSelectArea("ZCL011")
    ZCL011->(DbSetOrder(1))
    ZCL011->(DbSeek(xFilial("ZCL") + cId))
    While !ZCL011->(Eof()) .And. ZCL011->CLV_ID == cId
        oLine := JsonObject():New()
        oLine["linea"]    := ZCL011->CLV_LIN
        oLine["concepto"] := ZCL011->CLV_CON
        oLine["monto"]    := ZCL011->CLV_VAL
        oLine["adjunto"]  := ZCL011->CLV_URL
        AAdd(aLines, oLine)
        ZCL011->(DbSkip())
    EndDo
    oResp["items"] := aLines
Return .T.

Static Function ClvExpSetError(oResp, cMsg, nCode)
    oResp["ok"]      := .F.
    oResp["message"] := cMsg
    oResp["code"]    := nCode
    Self:SetStatus(nCode)
    Self:SetResponse(oResp:ToJson())
Return