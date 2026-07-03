#Include "Protheus.ch"
#Include "Restful.ch"

/*/{Protheus.doc} CLVWMS01
Claver Warehouse — REST API v1 (WMS móvil)
Boletín técnico: edge.warehouse
@author Claver Bridge
@since  01/07/2026
@version 1.0.0
/*/

WSRESTFUL CLVWMS01 DESCRIPTION "Claver Warehouse API v1" FORMAT APPLICATION_JSON

    WSMETHOD GET ;
        DESCRIPTION "Tareas de picking del operador" ;
        PATH "/api/claver/v1/wms/picking-tasks" ;
        PRODUCES APPLICATION_JSON

    WSMETHOD POST ;
        DESCRIPTION "Confirma picking" ;
        PATH "/api/claver/v1/wms/picking-tasks/{id}/confirm" ;
        PRODUCES APPLICATION_JSON ;
        Consumes APPLICATION_JSON

END WSRESTFUL

WSMETHOD GET WSSERVICE CLVWMS01
    Local oResp := JsonObject():New()
    Local cOpe  := ClvWmsAuthOperator()
    oResp["items"] := ClvWmsTasks(cOpe)
    Self:SetResponse(oResp:ToJson())
Return .T.

WSMETHOD POST WSSERVICE CLVWMS01
    Local cId   := Self:GetPathParam("id")
    Local oBody := JsonObject():New()
    Local oResp := JsonObject():New()
    oBody:FromJson(Self:GetContent())
    ClvWmsConfirm(cId, oBody["qty"], oBody["lote"], oResp)
    Self:SetResponse(oResp:ToJson())
Return .T.

Static Function ClvWmsAuthOperator()
Return Space(6)

Static Function ClvWmsTasks(cOpe)
Return {}

Static Function ClvWmsConfirm(cId, nQty, cLote, oResp)
    // TODO: MATA650 baixa estoque + ZCL020 CLV_STS := "C"
    oResp["ok"] := .T.
Return .T.