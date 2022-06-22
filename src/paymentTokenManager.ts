import { BigInt, log } from '@graphprotocol/graph-ts'
import { Asset, DefaultPaymentToken } from '../generated/schema'
import {
    DefaultPaymentTokenSet as DefaultPaymentTokenSetEvent,
    RegisteredPaymentTokenSet as RegisteredPaymentTokenSetEvent
} from '../generated/templates/PaymentTokenManagerContract/PaymentTokenManager'
import { PaymentToken, RegisteredPaymentToken } from '../generated/schema'
import { toAssetType } from './utils'


export function onRegisteredPaymentTokenSet(event: RegisteredPaymentTokenSetEvent): void {
    let pAssetAddress = event.params.assetAddress.toHexString()
    let pAt = toAssetType(event.params.assetType)
    
    let buyAssetAddress = event.params.buyAssetAddress.toHexString()
    let sellAssetAddress = event.params.sellAssetAddress.toHexString()

    let enabled = event.params.enabled

    let assetId = pAssetAddress.concat("-0")
    
    let pt = PaymentToken.load(pAssetAddress)
    if(pt == null) {
        pt = new PaymentToken(pAssetAddress)
        
        let ass = Asset.load(assetId)

        if (ass == null) {
            ass = new Asset(assetId)
            ass.assetAddress = pAssetAddress
            ass.assetId = BigInt.fromI32(0)
            ass.assetType = pAt
            ass.save()
        }

        pt.asset = ass.id
        pt.totalVolume = BigInt.fromI32(0)
        
    }

    pt.enabled = enabled
    pt.save()

    let rptid = sellAssetAddress.concat("-").concat(buyAssetAddress)
    let rpt = RegisteredPaymentToken.load(rptid)

    if (rpt == null) {
        rpt = new RegisteredPaymentToken(rptid)
        rpt.paymentToken = pt.id
        rpt.save()
    }
}

export function onDefaultPaymentTokenSet(event: DefaultPaymentTokenSetEvent): void {
    let pAssetAddress = event.params.assetAddress.toHexString()
    let pAt = toAssetType(event.params.assetType)
    
    let buyAssetAddress = event.params.enabled

    let enabled = event.params.enabled

    let assetId = pAssetAddress.concat("-0")
    
    let pt = DefaultPaymentToken.load(pAssetAddress)
    if(pt == null) {
        pt = new DefaultPaymentToken(pAssetAddress)
        
        let ass = Asset.load(assetId)

        if (ass == null) {
            ass = new Asset(assetId)
            ass.assetAddress = pAssetAddress
            ass.assetId = BigInt.fromI32(0)
            ass.assetType = pAt

            ass.save()
        }

        pt.asset = ass.id
        pt.totalVolume = BigInt.fromI32(0)
    }

    pt.enabled = enabled
    pt.save()
}
