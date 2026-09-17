#Include "Protheus.ch"
#Include "Restful.ch"
#Include "TopConn.ch"

/*/{Protheus.doc} CLVINV01
Claver Inversiones — REST v1 para el front /claver/protheus
Tablas: Z01 (tipos), Z02 (operacion), Z03 (MTM), SA6 (bancos), SE5 via FINA100.
No inserta SE5 a mano.

Boletin: edge.investments
@author Claver Bridge
@since  17/09/2026
@version 1.0.0
/*/

WSRESTFUL CLVINV01 DESCRIPTION "Claver Inversiones API v1" FORMAT APPLICATION_JSON

    WSMETHOD GET DESCRIPTION "Health" PATH "/api/claver/v1/investments/health" PRODUCES APPLICATION_JSON
    WSMETHOD GET DESCRIPTION "Tipos Z01" PATH "/api/claver/v1/investments/instruments" PRODUCES APPLICATION_JSON
    WSMETHOD GET DESCRIPTION "Bancos SA6" PATH "/api/claver/v1/investments/banks" PRODUCES APPLICATION_JSON
    WSMETHOD GET DESCRIPTION "Tenencias Z02" PATH "/api/claver/v1/investments/holdings" PRODUCES APPLICATION_JSON
    WSMETHOD GET DESCRIPTION "Tenencia" PATH "/api/claver/v1/investments/holdings/{id}" PRODUCES APPLICATION_JSON
    WSMETHOD GET DESCRIPTION "Valuaciones Z03" PATH "/api/claver/v1/investments/holdings/{id}/valuations" PRODUCES APPLICATION_JSON
    WSMETHOD GET DESCRIPTION "Asientos SE5" PATH "/api/claver/v1/investments/asientos" PRODUCES APPLICATION_JSON

    WSMETHOD POST DESCRIPTION "Alta inversion" PATH "/api/claver/v1/investments/holdings" PRODUCES APPLICATION_JSON Consumes APPLICATION_JSON
    WSMETHOD POST DESCRIPTION "Rescate" PATH "/api/claver/v1/investments/holdings/{id}/rescue" PRODUCES APPLICATION_JSON Consumes APPLICATION_JSON

END WSRESTFUL

WSMETHOD GET WSSERVICE CLVINV01
    Local cPath := Upper(Self:GetPath())
    Local cId   := Self:GetPathParam("id")
    Local oResp := JsonObject():New()

    If "HEALTH" $ cPath
        oResp["ok"] := .T.
        oResp["sku"] := "edge.investments"
        oResp["protheus"] := GetVersao()
        oResp["mv"] := GetMV("MV_CLVINV", .F., .T.)
        oResp["tables"] := {"Z01", "Z02", "Z03", "SA6", "SE5"}
    ElseIf "INSTRUMENT" $ cPath
        oResp["items"] := ClvInvListZ01()
    ElseIf "BANKS" $ cPath
        oResp["items"] := ClvInvListSA6()
    ElseIf "VALUATION" $ cPath
        oResp["items"] := ClvInvListZ03(cId)
    ElseIf "ASIENTO" $ cPath
        oResp["items"] := ClvInvListSE5()
    ElseIf "HOLDINGS" $ cPath .And. !Empty(cId)
        oResp := ClvInvGetZ02(cId)
        If ValType(oResp["id"]) == "U"
            Self:SetStatus(404)
            oResp["message"] := "holding no encontrada"
            Self:SetResponse(oResp:ToJson())
            Return .F.
        EndIf
    Else
        oResp["items"] := ClvInvListZ02()
        oResp["total"] := Len(oResp["items"])
    EndIf

    Self:SetResponse(oResp:ToJson())
Return .T.

WSMETHOD POST WSSERVICE CLVINV01
    Local cPath := Upper(Self:GetPath())
    Local cId   := Self:GetPathParam("id")
    Local oBody := JsonObject():New()
    Local oResp := JsonObject():New()

    oBody:FromJson(Self:GetContent())

    If "RESCUE" $ cPath
        If !ClvInvRescueRest(cId, oBody, oResp)
            Self:SetStatus(400)
            Self:SetResponse(oResp:ToJson())
            Return .F.
        EndIf
    Else
        If !ClvInvCreateRest(oBody, oResp)
            Self:SetStatus(400)
            Self:SetResponse(oResp:ToJson())
            Return .F.
        EndIf
    EndIf

    Self:SetResponse(oResp:ToJson())
Return .T.

Static Function ClvInvIsoDate(dVal)
    Local cS := DToS(dVal)
    If Empty(cS) .Or. cS == "        " .Or. Left(cS, 4) == "    "
        Return ""
    EndIf
Return SubStr(cS, 1, 4) + "-" + SubStr(cS, 5, 2) + "-" + SubStr(cS, 7, 2)

Static Function ClvInvStatus(cSt)
    cSt := AllTrim(cSt)
    If cSt == "2"
        Return "rescatada"
    ElseIf cSt == "3"
        Return "cancelada"
    EndIf
Return "activa"

Static Function ClvInvListZ01()
    Local aItems := {}
    Local oItem
    DbSelectArea("Z01")
    Z01->(DbSetOrder(1))
    Z01->(DbGoTop())
    While !Z01->(Eof())
        If Z01->Z01_FILIAL == xFilial("Z01")
            oItem := JsonObject():New()
            oItem["id"] := AllTrim(Z01->Z01_CODIGO)
            oItem["desc"] := AllTrim(Z01->Z01_DESCRI)
            oItem["renta"] := AllTrim(Z01->Z01_TIPO)
            oItem["usaApi"] := AllTrim(Z01->Z01_USAAPI) == "1"
            oItem["natCap"] := AllTrim(Z01->Z01_NATCAP)
            oItem["natInt"] := AllTrim(Z01->Z01_NATINT)
            aAdd(aItems, oItem)
        EndIf
        Z01->(DbSkip())
    EndDo
Return aItems

Static Function ClvInvListSA6()
    Local aItems := {}
    Local oItem
    DbSelectArea("SA6")
    SA6->(DbSetOrder(1))
    SA6->(DbGoTop())
    While !SA6->(Eof())
        If SA6->A6_FILIAL == xFilial("SA6")
            oItem := JsonObject():New()
            oItem["id"] := AllTrim(SA6->A6_COD)
            oItem["sa6"] := AllTrim(SA6->A6_COD)
            oItem["name"] := AllTrim(SA6->A6_NREDUZ)
            oItem["agencia"] := AllTrim(SA6->A6_AGENCIA)
            oItem["cuenta"] := AllTrim(SA6->A6_NUMCON)
            oItem["cbu"] := ""
            oItem["saldo"] := 0
            oItem["pendiente"] := 0
            aAdd(aItems, oItem)
        EndIf
        SA6->(DbSkip())
    EndDo
Return aItems

Static Function ClvInvFillZ02(oItem)
    Local nMtm := Z02->Z02_CAPINI
    oItem["id"] := AllTrim(Z02->Z02_NUMERO)
    oItem["tipoId"] := AllTrim(Z02->Z02_TIPO)
    oItem["ticker"] := AllTrim(Z02->Z02_TICKER)
    oItem["nombre"] := AllTrim(Z02->Z02_TICKER)
    oItem["bancoId"] := AllTrim(Z02->Z02_BANCO)
    oItem["agencia"] := AllTrim(Z02->Z02_AGENCI)
    oItem["cuenta"] := AllTrim(Z02->Z02_CUENTA)
    oItem["capital"] := Z02->Z02_CAPINI
    oItem["cantidad"] := Z02->Z02_CANTID
    oItem["preCom"] := Z02->Z02_PRECOM
    oItem["tasa"] := Z02->Z02_TASA
    oItem["inicio"] := ClvInvIsoDate(Z02->Z02_DTINV)
    oItem["vence"] := ClvInvIsoDate(Z02->Z02_DTVENC)
    oItem["moneda"] := Z02->Z02_MOEDA
    oItem["estado"] := ClvInvStatus(Z02->Z02_STATUS)
    nMtm := ClvInvPeekMtm(Z02->Z02_NUMERO, Z02->Z02_CAPINI)
    oItem["mtm"] := nMtm
Return oItem

Static Function ClvInvPeekMtm(cNumero, nFallback)
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

Static Function ClvInvListZ02()
    Local aItems := {}
    Local oItem
    DbSelectArea("Z02")
    Z02->(DbSetOrder(1))
    Z02->(DbGoTop())
    While !Z02->(Eof())
        If Z02->Z02_FILIAL == xFilial("Z02")
            oItem := JsonObject():New()
            ClvInvFillZ02(oItem)
            aAdd(aItems, oItem)
        EndIf
        Z02->(DbSkip())
    EndDo
Return aItems

Static Function ClvInvGetZ02(cId)
    Local oItem := JsonObject():New()
    DbSelectArea("Z02")
    Z02->(DbSetOrder(1))
    If Z02->(DbSeek(xFilial("Z02") + PadR(cId, TamSX3("Z02_NUMERO")[1])))
        ClvInvFillZ02(oItem)
    EndIf
Return oItem

Static Function ClvInvListZ03(cId)
    Local aItems := {}
    Local oItem
    DbSelectArea("Z03")
    Z03->(DbSetOrder(1))
    If Z03->(DbSeek(xFilial("Z03") + PadR(cId, TamSX3("Z03_NUMERO")[1])))
        While !Z03->(Eof()) .And. Z03->Z03_FILIAL == xFilial("Z03") .And. AllTrim(Z03->Z03_NUMERO) == AllTrim(cId)
            oItem := JsonObject():New()
            oItem["id"] := AllTrim(Z03->Z03_NUMERO) + "-" + DToS(Z03->Z03_FECHA)
            oItem["investId"] := AllTrim(Z03->Z03_NUMERO)
            oItem["fecha"] := ClvInvIsoDate(Z03->Z03_FECHA)
            oItem["precio"] := Z03->Z03_PRECIO
            oItem["valor"] := Z03->Z03_VALOR
            oItem["rtoDia"] := Z03->Z03_RENDIM
            oItem["origen"] := AllTrim(Z03->Z03_ORIGEN)
            aAdd(aItems, oItem)
            Z03->(DbSkip())
        EndDo
    EndIf
Return aItems

Static Function ClvInvListSE5()
    Local aItems := {}
    Local oItem
    Local cQ := ""
    Local cAlias := GetNextAlias()
    cQ := "SELECT E5_DATA, E5_TIPO, E5_VALOR, E5_NATUREZ, E5_HISTOR, E5_BANCO, E5_DOCUMEN "
    cQ += "FROM " + RetSqlName("SE5") + " SE5 "
    cQ += "WHERE SE5.D_E_L_E_T_ = ' ' AND E5_FILIAL = '" + xFilial("SE5") + "' "
    cQ += "AND (E5_HISTOR LIKE 'Inversion%' OR E5_HISTOR LIKE 'Rescate%' OR E5_HISTOR LIKE 'Intereses%' OR E5_HISTOR LIKE 'Perdida%') "
    cQ += "ORDER BY E5_DATA DESC"
    TcQuery cQ New Alias (cAlias)
    While !(cAlias)->(Eof())
        oItem := JsonObject():New()
        oItem["id"] := AllTrim((cAlias)->E5_DOCUMEN) + AllTrim((cAlias)->E5_TIPO) + DToS(SToD((cAlias)->E5_DATA))
        oItem["fecha"] := ClvInvIsoDate(SToD((cAlias)->E5_DATA))
        oItem["tipo"] := AllTrim((cAlias)->E5_TIPO)
        oItem["valor"] := (cAlias)->E5_VALOR
        oItem["naturaleza"] := AllTrim((cAlias)->E5_NATUREZ)
        oItem["histor"] := AllTrim((cAlias)->E5_HISTOR)
        oItem["bancoId"] := AllTrim((cAlias)->E5_BANCO)
        oItem["investId"] := ""
        aAdd(aItems, oItem)
        (cAlias)->(DbSkip())
    EndDo
    (cAlias)->(DbCloseArea())
Return aItems

Static Function ClvInvCreateRest(oBody, oResp)
    Local cNum := ""
    Local cTipo := AllTrim(cValToChar(oBody["tipoId"]))
    Local cTicker := AllTrim(cValToChar(oBody["ticker"]))
    Local cBanco := AllTrim(cValToChar(oBody["bancoId"]))
    Local nCap := Val(cValToChar(oBody["capital"]))
    Local nCant := Val(cValToChar(oBody["cantidad"]))
    Local nTasa := Val(cValToChar(oBody["tasa"]))
    Local nMoeda := Val(cValToChar(oBody["moneda"]))
    Local dIni := SToD(StrTran(cValToChar(oBody["inicio"]), "-", ""))
    Local dVen := SToD(StrTran(cValToChar(oBody["vence"]), "-", ""))
    Local cAgencia := AllTrim(cValToChar(oBody["agencia"]))
    Local cCuenta := AllTrim(cValToChar(oBody["cuenta"]))
    Local cNat := "INV001"
    Local aAutoFIN := {}
    Local nPre := 0
    Private lMsErroAuto := .F.

    If Empty(cTicker) .Or. nCap <= 0 .Or. Empty(cBanco)
        oResp["ok"] := .F.
        oResp["message"] := "ticker, capital y bancoId requeridos"
        Return .F.
    EndIf
    If nCant <= 0
        nCant := 1
    EndIf
    If nMoeda <> 2
        nMoeda := 1
    EndIf
    nPre := nCap / nCant

    DbSelectArea("SA6")
    SA6->(DbSetOrder(1))
    If SA6->(DbSeek(xFilial("SA6") + PadR(cBanco, TamSX3("A6_COD")[1])))
        If Empty(cAgencia)
            cAgencia := SA6->A6_AGENCIA
        EndIf
        If Empty(cCuenta)
            cCuenta := SA6->A6_NUMCON
        EndIf
    EndIf

    DbSelectArea("Z01")
    Z01->(DbSetOrder(1))
    If Z01->(DbSeek(xFilial("Z01") + PadR(cTipo, TamSX3("Z01_CODIGO")[1])))
        cNat := AllTrim(Z01->Z01_NATCAP)
    EndIf

    cNum := GetSXENum("Z02", "Z02_NUMERO")
    ConfirmSX8()

    Begin Transaction
        DbSelectArea("Z02")
        RecLock("Z02", .T.)
        Z02->Z02_FILIAL := xFilial("Z02")
        Z02->Z02_NUMERO := cNum
        Z02->Z02_TIPO   := cTipo
        Z02->Z02_TICKER := cTicker
        Z02->Z02_BANCO  := cBanco
        Z02->Z02_AGENCI := cAgencia
        Z02->Z02_CUENTA := cCuenta
        Z02->Z02_DTINV  := dIni
        Z02->Z02_DTVENC := dVen
        Z02->Z02_MOEDA  := nMoeda
        Z02->Z02_CAPINI := nCap
        Z02->Z02_CANTID := nCant
        Z02->Z02_PRECOM := nPre
        Z02->Z02_TASA   := nTasa
        Z02->Z02_STATUS := "1"
        MsUnlock()

        aAdd(aAutoFIN, {"E5_DATA",    dIni, Nil})
        aAdd(aAutoFIN, {"E5_TIPO",    "ND", Nil})
        aAdd(aAutoFIN, {"E5_MOEDA",   nMoeda, Nil})
        aAdd(aAutoFIN, {"E5_VALOR",   nCap, Nil})
        aAdd(aAutoFIN, {"E5_NATUREZ", cNat, Nil})
        aAdd(aAutoFIN, {"E5_BANCO",   cBanco, Nil})
        aAdd(aAutoFIN, {"E5_AGENCIA", cAgencia, Nil})
        aAdd(aAutoFIN, {"E5_CONTA",   cCuenta, Nil})
        aAdd(aAutoFIN, {"E5_HISTOR",  "Inversion " + cTicker, Nil})
        MSExecAuto({|x, y| FINA100(x, y)}, 0, aAutoFIN, 3)

        If lMsErroAuto
            DisarmTransaction()
            oResp["ok"] := .F.
            oResp["message"] := "FINA100 rechazo el ND. Z02 no queda grabada."
            Return .F.
        EndIf
    End Transaction

    oResp["ok"] := .T.
    oResp["id"] := AllTrim(cNum)
    oResp["numeroLegacy"] := AllTrim(cNum)
    oResp["estado"] := "activa"
Return .T.

Static Function ClvInvRescueRest(cId, oBody, oResp)
    Local nTotal := Val(cValToChar(oBody["total"]))
    Local dRes := SToD(StrTran(cValToChar(oBody["fecha"]), "-", ""))
    Local nCap := 0
    Local nInt := 0
    Local cNatCap := "INV001"
    Local cNatInt := "INT001"
    Local aAuto := {}
    Private lMsErroAuto := .F.

    DbSelectArea("Z02")
    Z02->(DbSetOrder(1))
    If !Z02->(DbSeek(xFilial("Z02") + PadR(cId, TamSX3("Z02_NUMERO")[1])))
        oResp["ok"] := .F.
        oResp["message"] := "holding no encontrada"
        Return .F.
    EndIf
    If AllTrim(Z02->Z02_STATUS) == "2"
        oResp["ok"] := .F.
        oResp["message"] := "ya rescatada"
        Return .F.
    EndIf
    If nTotal <= 0
        nTotal := ClvInvPeekMtm(Z02->Z02_NUMERO, Z02->Z02_CAPINI)
    EndIf
    If Empty(dRes)
        dRes := dDataBase
    EndIf
    nCap := Z02->Z02_CAPINI
    nInt := nTotal - nCap

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

        aSize(aAuto, 0)
        aAdd(aAuto, {"E5_DATA", dRes, Nil})
        aAdd(aAuto, {"E5_TIPO", "NC", Nil})
        aAdd(aAuto, {"E5_MOEDA", Z02->Z02_MOEDA, Nil})
        aAdd(aAuto, {"E5_VALOR", nCap, Nil})
        aAdd(aAuto, {"E5_NATUREZ", cNatCap, Nil})
        aAdd(aAuto, {"E5_BANCO", Z02->Z02_BANCO, Nil})
        aAdd(aAuto, {"E5_AGENCIA", Z02->Z02_AGENCI, Nil})
        aAdd(aAuto, {"E5_CONTA", Z02->Z02_CUENTA, Nil})
        aAdd(aAuto, {"E5_HISTOR", "Rescate capital " + AllTrim(Z02->Z02_TICKER), Nil})
        MSExecAuto({|x, y| FINA100(x, y)}, 0, aAuto, 3)
        If lMsErroAuto
            DisarmTransaction()
            oResp["ok"] := .F.
            oResp["message"] := "FINA100 fallo NC capital"
            Return .F.
        EndIf

        If nInt <> 0
            aSize(aAuto, 0)
            aAdd(aAuto, {"E5_DATA", dRes, Nil})
            aAdd(aAuto, {"E5_TIPO", IIf(nInt > 0, "NC", "ND"), Nil})
            aAdd(aAuto, {"E5_MOEDA", Z02->Z02_MOEDA, Nil})
            aAdd(aAuto, {"E5_VALOR", Abs(nInt), Nil})
            aAdd(aAuto, {"E5_NATUREZ", cNatInt, Nil})
            aAdd(aAuto, {"E5_BANCO", Z02->Z02_BANCO, Nil})
            aAdd(aAuto, {"E5_AGENCIA", Z02->Z02_AGENCI, Nil})
            aAdd(aAuto, {"E5_CONTA", Z02->Z02_CUENTA, Nil})
            aAdd(aAuto, {"E5_HISTOR", IIf(nInt > 0, "Intereses ", "Perdida financiera ") + AllTrim(Z02->Z02_TICKER), Nil})
            lMsErroAuto := .F.
            MSExecAuto({|x, y| FINA100(x, y)}, 0, aAuto, 3)
            If lMsErroAuto
                DisarmTransaction()
                oResp["ok"] := .F.
                oResp["message"] := "FINA100 fallo movimiento de interes"
                Return .F.
            EndIf
        EndIf
    End Transaction

    oResp["ok"] := .T.
    oResp["id"] := AllTrim(cId)
    oResp["estado"] := "rescatada"
    oResp["resultado"] := nInt
Return .T.
