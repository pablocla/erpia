#INCLUDE "PROTHEUS.CH"
#INCLUDE "RESTFUL.CH"

/*/{Protheus.doc} ClaverExpensas
@description  API RESTful para integración con Claver Consorcios.
              Permite recibir la liquidación de expensas e insertarlas 
              como Títulos por Cobrar (SE1) en el módulo SIGAFIN de Protheus.
@author       Claver ERP
@version      1.0
/*/
WSRESTFUL ClaverExpensas DESCRIPTION "API REST para Claver Consorcios"
    
    // Declaración del endpoint POST
    WSMETHOD POST DESCRIPTION "Recibe la liquidación de una expensa y genera la deuda" WSSYNTAX "/api/v1/claver/expensas" PATH "/api/v1/claver/expensas" PRODUCES APPLICATION_JSON

END WSRESTFUL

/*/{Protheus.doc} POST
@description Método para procesar el JSON de entrada y grabar en SE1
/*/
WSMETHOD POST WSRECEIVE paramJSON WSSERVICE ClaverExpensas
    Local cBody       := ::GetContent()
    Local oJson       := JsonObject():New()
    Local lRet        := .T.
    Local aAuto       := {}
    Local cError      := ""
    
    // Parsear el JSON recibido
    If Empty(cBody)
        ::SetResponse('{"error": "Cuerpo de la petición vacío"}')
        ::SetStatus(400)
        Return .F.
    EndIf
    
    oJson:FromJson(cBody)
    
    // Validar campos obligatorios
    If !oJson:HasProperty("cuit_residente") .Or. !oJson:HasProperty("monto") .Or. !oJson:HasProperty("periodo")
        ::SetResponse('{"error": "Faltan datos obligatorios: cuit_residente, monto, periodo"}')
        ::SetStatus(400)
        Return .F.
    EndIf
    
    // Buscar Cliente en SA1 usando el CUIT
    DbSelectArea("SA1")
    SA1->(DbSetOrder(3)) // Asumiendo que el índice 3 es por A1_CGC (CUIT)
    If !SA1->(DbSeek(xFilial("SA1") + oJson:GetJsonObject("cuit_residente")))
        ::SetResponse('{"error": "Residente no encontrado en SA1 con CUIT: ' + oJson:GetJsonObject("cuit_residente") + '"}')
        ::SetStatus(404)
        Return .F.
    EndIf
    
    // Preparar el array para el MsExecAuto de FINA040 (Cuentas por Cobrar)
    aAdd(aAuto, {"E1_PREFIXO" , "EXP"                    , Nil})
    aAdd(aAuto, {"E1_NUM"     , GetSxENum("SE1","E1_NUM"), Nil}) // Numerador automático
    aAdd(aAuto, {"E1_PARCELA" , "1"                      , Nil})
    aAdd(aAuto, {"E1_TIPO"    , "EX"                     , Nil}) // Tipo Expensa
    aAdd(aAuto, {"E1_NATUREZ" , "EXPENSAS"               , Nil})
    aAdd(aAuto, {"E1_CLIENTE" , SA1->A1_COD              , Nil})
    aAdd(aAuto, {"E1_LOJA"    , SA1->A1_LOJA             , Nil})
    aAdd(aAuto, {"E1_EMISSAO" , dDatabase                , Nil})
    aAdd(aAuto, {"E1_VENCTO"  , dDatabase + 10           , Nil}) // Vencimiento en 10 días
    aAdd(aAuto, {"E1_VALOR"   , oJson:GetJsonObject("monto") , Nil})
    aAdd(aAuto, {"E1_HIST"    , "Expensas periodo " + oJson:GetJsonObject("periodo") , Nil})
    
    // Llamada a la rutina automática de Protheus
    Private lMsErroAuto := .F.
    MSExecAuto({|x,y| Fina040(x,y)}, aAuto, 3) // 3 = Inclusión
    
    If lMsErroAuto
        cError := MostraErro("/dios", "/dios") // Captura error en variable
        ::SetResponse('{"error": "Fallo al insertar en SE1", "details": "' + cError + '"}')
        ::SetStatus(500)
        lRet := .F.
    Else
        ::SetResponse('{"success": true, "message": "Expensa registrada correctamente en Protheus", "titulo": "' + SE1->E1_NUM + '"}')
        ::SetStatus(201)
    EndIf
    
    Return lRet
