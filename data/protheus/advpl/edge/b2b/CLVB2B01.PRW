#Include "Protheus.ch"
#Include "Restful.ch"

/*/{Protheus.doc} CLVB2B01
Claver B2B Portal — REST API v1
Boletín técnico: edge.b2b
@author Claver Bridge
@since  01/07/2026
@version 1.0.0
/*/

WSRESTFUL CLVB2B01 DESCRIPTION "Claver B2B Portal API v1" FORMAT APPLICATION_JSON

    WSMETHOD GET ;
        DESCRIPTION "Pedidos del cliente portal" ;
        PATH "/api/claver/v1/b2b/orders" ;
        PRODUCES APPLICATION_JSON

    WSMETHOD GET ;
        DESCRIPTION "Facturas y estado de cuenta" ;
        PATH "/api/claver/v1/b2b/invoices" ;
        PRODUCES APPLICATION_JSON

    WSMETHOD POST ;
        DESCRIPTION "Alta pedido desde portal" ;
        PATH "/api/claver/v1/b2b/orders" ;
        PRODUCES APPLICATION_JSON ;
        Consumes APPLICATION_JSON

END WSRESTFUL

WSMETHOD GET WSSERVICE CLVB2B01
    Local oResp := JsonObject():New()
    Local cPath := Upper(Self:GetPath())
    Local cCli  := ClvB2bAuthClient()

    If "INVOICES" $ cPath
        oResp["items"] := ClvB2bInvoices(cCli)
    Else
        oResp["items"] := ClvB2bOrders(cCli)
    EndIf

    Self:SetResponse(oResp:ToJson())
Return .T.

WSMETHOD POST WSSERVICE CLVB2B01
    Local oBody := JsonObject():New()
    Local oResp := JsonObject():New()
    oBody:FromJson(Self:GetContent())
    ClvB2bCreateOrder(oBody, oResp)
    Self:SetResponse(oResp:ToJson())
Return .T.

Static Function ClvB2bAuthClient()
    // TODO: mapear token Claver → A1_COD (SA1)
Return Space(6)

Static Function ClvB2bOrders(cCli)
Return {}

Static Function ClvB2bInvoices(cCli)
Return {}

Static Function ClvB2bCreateOrder(oBody, oResp)
    // TODO: ExecAuto SC5/SC6, marcar CLV_B2B := "S"
    oResp["id"]     := "PED-" + FWTimeStamp(3)
    oResp["numero"] := oResp["id"]
Return .T.