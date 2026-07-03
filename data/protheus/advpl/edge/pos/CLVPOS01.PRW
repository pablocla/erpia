#Include "Protheus.ch"
#Include "Restful.ch"

/*/{Protheus.doc} CLVPOS01
Claver POS / Kiosk — REST API v1
Boletín técnico: edge.pos
@author Claver Bridge
@since  01/07/2026
@version 1.0.0
/*/

WSRESTFUL CLVPOS01 DESCRIPTION "Claver POS API v1" FORMAT APPLICATION_JSON

    WSMETHOD POST ;
        DESCRIPTION "Inyecta ticket de venta" ;
        PATH "/api/claver/v1/pos/tickets" ;
        PRODUCES APPLICATION_JSON ;
        Consumes APPLICATION_JSON

END WSRESTFUL

WSMETHOD POST WSSERVICE CLVPOS01
    Local oBody := JsonObject():New()
    Local oResp := JsonObject():New()
    oBody:FromJson(Self:GetContent())

    If !ClvPosValidate(oBody, oResp)
        Self:SetResponse(oResp:ToJson())
        Return .F.
    EndIf

    ClvPosInjectTicket(oBody, oResp)
    Self:SetResponse(oResp:ToJson())
Return .T.

Static Function ClvPosValidate(oBody, oResp)
    If Empty(oBody["caja"])
        oResp["message"] := "caja requerida"
        Self:SetStatus(400)
        Return .F.
    EndIf
Return .T.

Static Function ClvPosInjectTicket(oBody, oResp)
    // TODO: MATA410 / MaFatura — marcar CLV_POS := "S", CLV_CAJ
    oResp["ticketId"]     := "TKT-" + FWTimeStamp(3)
    oResp["numeroFiscal"] := GetMV("MV_CLVPV") + "-" + oResp["ticketId"]
Return .T.