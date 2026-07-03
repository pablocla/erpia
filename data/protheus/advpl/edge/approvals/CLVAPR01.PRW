#Include "Protheus.ch"
#Include "Restful.ch"

/*/{Protheus.doc} CLVAPR01
Claver Approvals — REST API v1
Boletín técnico: edge.approvals
@author Claver Bridge
@since  01/07/2026
@version 1.0.0
/*/

WSRESTFUL CLVAPR01 DESCRIPTION "Claver Approvals API v1" FORMAT APPLICATION_JSON

    WSMETHOD GET ;
        DESCRIPTION "Documentos pendientes de aprobación" ;
        WSSYNTAX "/api/claver/v1/approvals/pending" ;
        PATH "/api/claver/v1/approvals/pending" ;
        PRODUCES APPLICATION_JSON

    WSMETHOD POST ;
        DESCRIPTION "Aprobar documento" ;
        WSSYNTAX "/api/claver/v1/approvals/{id}/approve" ;
        PATH "/api/claver/v1/approvals/{id}/approve" ;
        PRODUCES APPLICATION_JSON ;
        Consumes APPLICATION_JSON

    WSMETHOD POST ;
        DESCRIPTION "Rechazar documento" ;
        WSSYNTAX "/api/claver/v1/approvals/{id}/reject" ;
        PATH "/api/claver/v1/approvals/{id}/reject" ;
        PRODUCES APPLICATION_JSON ;
        Consumes APPLICATION_JSON

END WSRESTFUL

WSMETHOD GET WSSERVICE CLVAPR01
    Local oResp  := JsonObject():New()
    Local aItems := ClvAprPendingList()
    oResp["items"] := aItems
    oResp["total"] := Len(aItems)
    Self:SetResponse(oResp:ToJson())
Return .T.

WSMETHOD POST WSSERVICE CLVAPR01
    Local cPath := Upper(Self:GetPath())
    Local cId   := Self:GetPathParam("id")
    Local oBody := JsonObject():New()
    Local oResp := JsonObject():New()

    If "REJECT" $ cPath
        oBody:FromJson(Self:GetContent())
        If Empty(oBody["motivo"])
            ClvAprError(oResp, "motivo requerido", 400)
            Return .F.
        EndIf
        ClvAprReject(cId, oBody["motivo"], oResp)
    Else
        oBody:FromJson(Self:GetContent())
        ClvAprApprove(cId, oBody["comentario"], oResp)
    EndIf

    Self:SetResponse(oResp:ToJson())
Return .T.

Static Function ClvAprPendingList()
    // TODO: consultar SCR + workflow MATA020 filtrado por aprobador
Return {}

Static Function ClvAprApprove(cId, cComent, oResp)
    // TODO: MaAprov() / rutina workflow nativa
    oResp["ok"]         := .T.
    oResp["nuevoEstado"] := "A"
Return .T.

Static Function ClvAprReject(cId, cMotivo, oResp)
    oResp["ok"]         := .T.
    oResp["nuevoEstado"] := "R"
Return .T.

Static Function ClvAprError(oResp, cMsg, nCode)
    oResp["ok"]      := .F.
    oResp["message"] := cMsg
    Self:SetStatus(nCode)
Return