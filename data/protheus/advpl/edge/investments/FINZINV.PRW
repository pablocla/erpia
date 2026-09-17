#include 'protheus.ch'
#include 'fwmvcdef.ch'

/*/{Protheus.doc} FINZINV
Gestion de Inversiones Financieras (cabecera Z02 + detalle Z03).
Alta: graba Z02 y dispara ExecAuto FINA100 (ND) contra SA6.
Z03 es solo lectura en pantalla — lo llena JOBFINZ03 / API / tasa fija.

Alineamiento socio TOTVS + Claver Edge (edge.investments).
@author Claver / partner TOTVS
@since  17/09/2026
@version 1.1.0
/*/
User Function FINZINV()
    Local oBrowse

    oBrowse := FWMBrowse():New()
    oBrowse:SetAlias('Z02')
    oBrowse:SetDescription('Gestion de Inversiones')
    oBrowse:Activate()
Return NIL

Static Function MenuDef()
    Local aMenu := {}

    ADD OPTION aMenu TITLE 'Visualizar' ACTION 'VIEWDEF.FINZINV' OPERATION 2 ACCESS 0
    ADD OPTION aMenu TITLE 'Incluir'    ACTION 'VIEWDEF.FINZINV' OPERATION 3 ACCESS 0
    ADD OPTION aMenu TITLE 'Modificar'  ACTION 'VIEWDEF.FINZINV' OPERATION 4 ACCESS 0
    ADD OPTION aMenu TITLE 'Borrar'     ACTION 'VIEWDEF.FINZINV' OPERATION 5 ACCESS 0
    ADD OPTION aMenu TITLE 'Imprimir'   ACTION 'VIEWDEF.FINZINV' OPERATION 8 ACCESS 0
    ADD OPTION aMenu TITLE 'Rescatar'   ACTION 'U_FINZRES()'    OPERATION 6 ACCESS 0
Return aMenu

Static Function ModelDef()
    Local oModel
    Local oStZ02 := FWFormStruct(1, 'Z02')
    Local oStZ03 := FWFormStruct(1, 'Z03')
    Local aRelZ03 := {}

    oModel := MPFormModel():New('FINZINV_M', /*bPre*/, /*bPos*/, {|oM| Z02Commit(oM)}, /*bCancel*/)
    oModel:SetDescription('Modelo de Inversiones')

    oModel:AddFields('Z02MASTER', /*cOwner*/, oStZ02)
    oModel:GetModel('Z02MASTER'):SetDescription('Datos de la Inversion')

    oModel:AddGrid('Z03DETAIL', 'Z02MASTER', oStZ03)
    oModel:GetModel('Z03DETAIL'):SetDescription('Valuacion diaria (Mark-to-Market)')

    aAdd(aRelZ03, {'Z03_FILIAL', 'xFilial("Z03")'})
    aAdd(aRelZ03, {'Z03_NUMERO', 'Z02_NUMERO'})
    oModel:SetRelation('Z03DETAIL', aRelZ03, Z03->(IndexKey(1)))
    oModel:SetPrimaryKey({'Z02_FILIAL', 'Z02_NUMERO'})
Return oModel

Static Function ViewDef()
    Local oModel := FWLoadModel('FINZINV')
    Local oView
    Local oStZ02 := FWFormStruct(2, 'Z02')
    Local oStZ03 := FWFormStruct(2, 'Z03')

    oView := FWFormView():New()
    oView:SetModel(oModel)
    oView:AddField('VIEW_Z02', oStZ02, 'Z02MASTER')
    oView:AddGrid('VIEW_Z03', oStZ03, 'Z03DETAIL')
    oView:CreateHorizontalBox('BOX_CABECERA', 40)
    oView:CreateHorizontalBox('BOX_DETALLE', 60)
    oView:SetOwnerView('VIEW_Z02', 'BOX_CABECERA')
    oView:SetOwnerView('VIEW_Z03', 'BOX_DETALLE')
    oView:SetNoInsertLine('VIEW_Z03')
    oView:SetNoDeleteLine('VIEW_Z03')
Return oView

/*---------------------------------------------------------------------*
 | Commit: FWFormCommit + FINA100 ND en inclusion. Rollback si falla.  |
 *---------------------------------------------------------------------*/
Static Function Z02Commit(oModel)
    Local lRet := .T.
    Local oModelZ02 := oModel:GetModel('Z02MASTER')
    Local nOperacion := oModel:GetOperation()
    Local aAutoFIN := {}
    Local cNat := "INV001"
    Local cTipo := ""
    Private lMsErroAuto := .F.

    lRet := FWFormCommit(oModel)

    If lRet .And. nOperacion == 3
        cTipo := oModelZ02:GetValue('Z02_TIPO')
        DbSelectArea("Z01")
        Z01->(DbSetOrder(1))
        If Z01->(DbSeek(xFilial("Z01") + cTipo))
            cNat := AllTrim(Z01->Z01_NATCAP)
        EndIf

        aAdd(aAutoFIN, {"E5_DATA",    oModelZ02:GetValue('Z02_DTINV'), Nil})
        aAdd(aAutoFIN, {"E5_TIPO",    "ND", Nil})
        aAdd(aAutoFIN, {"E5_MOEDA",   oModelZ02:GetValue('Z02_MOEDA'), Nil})
        aAdd(aAutoFIN, {"E5_VALOR",   oModelZ02:GetValue('Z02_CAPINI'), Nil})
        aAdd(aAutoFIN, {"E5_NATUREZ", cNat, Nil})
        aAdd(aAutoFIN, {"E5_BANCO",   oModelZ02:GetValue('Z02_BANCO'), Nil})
        aAdd(aAutoFIN, {"E5_AGENCIA", oModelZ02:GetValue('Z02_AGENCI'), Nil})
        aAdd(aAutoFIN, {"E5_CONTA",   oModelZ02:GetValue('Z02_CUENTA'), Nil})
        aAdd(aAutoFIN, {"E5_HISTOR",  "Inversion " + AllTrim(oModelZ02:GetValue('Z02_TICKER')), Nil})

        MSExecAuto({|x, y| FINA100(x, y)}, 0, aAutoFIN, 3)

        If lMsErroAuto
            lRet := .F.
            MostraErro()
            DisarmTransaction()
        EndIf
    EndIf
Return lRet
