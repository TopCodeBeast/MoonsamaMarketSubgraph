import { BigInt, log } from '@graphprotocol/graph-ts'
import {
    Order as OrderEvent,
    Fill as FillEvent,
    Cancel as CancelEvent,
    PaymentTokenSet as PaymentTokenEvent,
    PaymentTokenManagerSet as PaymentTokenManagerSetEvent,
} from '../generated/MarketplaceV2/MarketplaceV2'
import { PaymentTokenManagerContract } from '../generated/templates'
import { Order, Fill, Cancel, User, Asset, StrategyType, EscrowBalance, LastTradedPrice, PaymentToken, AssetStat, CollectionStat } from '../generated/schema'
import { getPPU, getPPUFill, toAssetType } from './utils'

export function onOrder(event: OrderEvent): void {

    let id = event.params.orderHash.toHexString()
    let order = Order.load(id)

    if (order == null) {
        log.debug("Creating new order..: {}", [id])
        order = new Order(id)
    }

    let sellAssetAddress = event.params.sellAssetAddress.toHexString()
    let sellAssetId = event.params.sellAssetId
    let sellAssetType = toAssetType(event.params.sellAssetType)

    let sellAssetEntityId = sellAssetAddress.concat("-").concat(sellAssetId.toString())
    let sellAsset = Asset.load(sellAssetEntityId)

    if (!sellAsset) {
        log.debug("Sell asset {} does not exist. Creating..", [sellAssetEntityId])
        sellAsset = new Asset(sellAssetEntityId)
        sellAsset.assetId = sellAssetId
        sellAsset.assetAddress = sellAssetAddress
        sellAsset.assetType = sellAssetType
        sellAsset.save()
    }

    let buyAssetAddress = event.params.buyAssetAddress.toHexString()
    let buyAssetId = event.params.buyAssetId
    let buyAssetType = toAssetType(event.params.buyAssetType)

    let buyAssetEntityId = buyAssetAddress.concat("-").concat(buyAssetId.toString())
    let buyAsset = Asset.load(buyAssetEntityId)
    if (!buyAsset) {
        log.debug("Buy asset {} does not exist. Creating..", [buyAssetEntityId])
        buyAsset = new Asset(buyAssetEntityId)
        buyAsset.assetId = buyAssetId
        buyAsset.assetAddress = buyAssetAddress
        buyAsset.assetType = buyAssetType
        buyAsset.save()
    }


    let seller = event.params.seller.toHexString()
    let user = User.load(seller)
    if (!user) {
        log.debug("Seller user {} does not exist. Creating..", [seller])
        user = new User(seller)
        //user.escrowBalances = []
        user.save()
    }

    let st = StrategyType.load(event.params.strategy.toHexString())
    if (st == null) {
        log.debug("StrategyType {} does not exist. Aborting.", [event.params.strategy.toHexString()])
    }
    assert(st != null)

    order.strategyType = st.id
    order.seller = user.id
    order.sellAsset = sellAsset.id
    order.buyAsset = buyAsset.id
    //order.strategy = id // order strategy id is the same as order id
    order.salt = event.params.salt.toHexString()
    order.active = true
    order.createdAt = event.block.timestamp
    //order.fills = []

    let balanceId = sellAssetEntityId.concat("-").concat(seller)
    let eb = EscrowBalance.load(balanceId)
    if (eb == null) {
        eb = new EscrowBalance(balanceId)
        eb.quantity = BigInt.fromI32(0)
        eb.token = sellAsset.id
        eb.user = user.id
    }
    eb.quantity = eb.quantity.plus(event.params.sellerEscrowsAmount)
    eb.save()

    let balanceId2 = buyAssetEntityId.concat("-").concat(seller)
    let eb2 = EscrowBalance.load(balanceId2)
    if (eb2 == null) {
        eb2 = new EscrowBalance(balanceId2)
        eb2.token = buyAsset.id
        eb2.user = user.id
        eb2.quantity = BigInt.fromI32(0)
        eb2.save()
    }

    // asset stats

    let pt = PaymentToken.load(buyAsset.assetAddress)
    let orderType = 'SELL'
    let asset = sellAsset
    if (pt == null) {
        orderType = 'BUY'
        asset = buyAsset
        pt = PaymentToken.load(sellAsset.assetAddress)
        assert(pt != null)
    }

    // collection stat

    let collectionStatId = asset.assetAddress.concat('-').concat(pt.id)
    let collectionStat = CollectionStat.load(collectionStatId)

    if (collectionStat == null) {
        collectionStat = new CollectionStat(collectionStatId)
        collectionStat.tradeCount = BigInt.fromI32(0)
        collectionStat.totalVolume = BigInt.fromI32(0)
    }

    // asset stat

    let assetStatId = asset.id.concat('-').concat(pt.id)
    let assetStat = AssetStat.load(assetStatId)
    if (assetStat == null) {
        assetStat = new AssetStat(assetStatId)
        assetStat.tradeCount = BigInt.fromI32(0)
        assetStat.totalVolume = BigInt.fromI32(0)
        assetStat.asset = asset.id
        assetStat.collectionStat = collectionStat.id
    }

    if (orderType === 'SELL') {
        assetStat.lastSellOffer = order.id
        collectionStat.lastSellOffer = order.id
    } else {
        assetStat.lastBuyOffer = order.id
        collectionStat.lastBuyOffer = order.id
    }

    if (order.askPerUnitNominator != null && order.askPerUnitDenominator != null) {
        order.pricePerUnit = getPPU(orderType, order.askPerUnitNominator as BigInt, order.askPerUnitDenominator as BigInt)
    }

    order.orderType = orderType
    log.debug("New order {} created", [id])
    order.save()
    collectionStat.save()
    assetStat.save()
}

export function onFill(event: FillEvent): void {
    let id = event.transaction.hash.toHexString()
    let orderId = event.params.orderHash.toHexString()

    let order = Order.load(orderId)
    assert(order != null)

    order.quantityLeft = order.quantityLeft.minus(event.params.sellerSendsAmountFull)
    order.save()

    let buyer = event.params.buyer.toHexString()
    let user = User.load(buyer)
    if (!user) {
        user = new User(buyer)
        //user.escrowBalances = []
        user.save()
    }

    let fill = new Fill(id)
    fill.buyer = user.id
    fill.buyerSendsAmountFull = event.params.buyerSendsAmountFull
    fill.buyerSentAmount = event.params.buyerSentAmount
    fill.sellerSendsAmountFull = event.params.sellerSendsAmountFull
    fill.sellerSentAmount = event.params.sellerSentAmount
    fill.complete = event.params.complete
    fill.order = order.id
    fill.createdAt = event.block.timestamp
    fill.save()

    order.active = !event.params.complete
    // let fills = order.fills
    // fills.push(id)
    // order.fills = fills
    order.save()

    let balanceId = order.sellAsset.concat("-").concat(order.seller)
    log.debug("fill sellAsset escrow balance id {}", [balanceId])
    let eb = EscrowBalance.load(balanceId)
    assert(eb != null)
    eb.quantity = eb.quantity.minus(fill.sellerSendsAmountFull)
    eb.save()


    let buyAsset = Asset.load(order.buyAsset)
    assert(buyAsset != null)

    //log.warning("buyAsset>>> id:{}, address{}, aid:{}, type:{}", [buyAsset.id, buyAsset.assetAddress, buyAsset.assetId.toString(), buyAsset.assetType])

    let pt = PaymentToken.load(buyAsset.assetAddress)
    let ltp = LastTradedPrice.load(order.sellAsset)
    let lastTrade = order.sellAsset
    let asset = Asset.load(order.sellAsset)
    let amount = fill.buyerSendsAmountFull
    let orderType = 'SELL'

    //log.warning("sellasset: {}, buyasset: {}", [order.sellAsset, order.buyAsset])

    let wasOpenMarketDeal = order.onlyTo == '0x0000000000000000000000000000000000000000'

    let apun = order.askPerUnitNominator as BigInt
    let apud = order.askPerUnitDenominator as BigInt

    log.info('apun: {}, apud: {}', [apun.toString(), apud.toString()])

    // SELL ORDER TYPE CASE
    if (pt != null) {
        pt.totalVolume = pt.totalVolume.plus(amount)
        pt.save()

        // exclude OTC deals
        if (wasOpenMarketDeal) {
            if (ltp == null) {
                //log.debug('SELL BRANCH - LTP NULL', [])
                ltp = new LastTradedPrice(order.sellAsset)
                ltp.asset = order.sellAsset
            }
            ltp.orderType = orderType
            ltp.amount = amount
            ltp.user = user.id
            //ltp.unitPrice = order.pricePerUnit as BigInt
            ltp.askPerUnitNominator = apun
            ltp.askPerUnitDenominator = apud
            ltp.unitPrice = getPPUFill(orderType, fill.buyerSendsAmountFull, fill.sellerSendsAmountFull)
            ltp.fill = fill.id
            ltp.save()

        }
    } else {

        let sellAsset = Asset.load(order.sellAsset)
        assert(sellAsset != null)

        pt = PaymentToken.load(sellAsset.assetAddress)
        assert(pt != null)

        asset = Asset.load(order.buyAsset)

        amount = fill.sellerSendsAmountFull
        orderType = 'BUY'

        pt.totalVolume = pt.totalVolume.plus(amount)
        pt.save()

        // exclude OTC deals
        lastTrade = order.buyAsset
        ltp = LastTradedPrice.load(order.buyAsset)
        if (wasOpenMarketDeal) {
            if (ltp == null) {
                //log.debug('BUY BRANCH - LTP NULL', [])
                ltp = new LastTradedPrice(order.buyAsset)
                ltp.asset = order.buyAsset
            }
            ltp.orderType = orderType
            ltp.askPerUnitNominator = apun
            ltp.askPerUnitDenominator = apud
            ltp.unitPrice = getPPUFill(orderType, fill.buyerSendsAmountFull, fill.sellerSendsAmountFull)
            ltp.user = user.id
            //ltp.unitPrice = order.pricePerUnit as BigInt
            ltp.amount = amount
            ltp.fill = fill.id
            ltp.save()
        }
    }

    // setting stats

    assert(asset != null)

    let assetStatId = asset.id.concat('-').concat(pt.id)
    let assetStat = AssetStat.load(assetStatId)
    assert(assetStat != null)

    let collectionStatId = asset.assetAddress.concat('-').concat(pt.id)
    let collectionStat = CollectionStat.load(collectionStatId)

    assert(collectionStat != null)

    assetStat.tradeCount = assetStat.tradeCount.plus(BigInt.fromI32(1))
    assetStat.totalVolume = assetStat.totalVolume.plus(amount)
    assetStat.lastTrade = lastTrade
    
    collectionStat.tradeCount = collectionStat.tradeCount.plus(BigInt.fromI32(1))
    collectionStat.totalVolume = collectionStat.totalVolume.plus(amount)
    collectionStat.lastTrade = lastTrade

    if (wasOpenMarketDeal) {
        if (orderType === 'SELL') {
            if (assetStat.highestSellEver != null) {
                let prevltp = LastTradedPrice.load(assetStat.highestSellEver)
                assert(prevltp != null)
                if (!ltp.unitPrice.lt(prevltp.unitPrice)) {
                    assetStat.highestSellEver = ltp.id
                }
            } else {
                assetStat.highestSellEver = ltp.id
            }

            if (collectionStat.highestSellEver != null) {
                let prevltp = LastTradedPrice.load(collectionStat.highestSellEver)
                assert(prevltp != null)
                if (!ltp.unitPrice.lt(prevltp.unitPrice)) {
                    collectionStat.highestSellEver = ltp.id
                }
            } else {
                collectionStat.highestSellEver = ltp.id
            }
        } else {
            if (assetStat.highestBuyEver != null) {
                let prevltp = LastTradedPrice.load(assetStat.highestBuyEver)
                assert(prevltp != null)
                if (!ltp.unitPrice.lt(prevltp.unitPrice)) {
                    assetStat.highestBuyEver = ltp.id
                }
            } else {
                assetStat.highestBuyEver = ltp.id
            }

            if (collectionStat.highestBuyEver != null) {
                let prevltp = LastTradedPrice.load(collectionStat.highestBuyEver)
                assert(prevltp != null)
                if (!ltp.unitPrice.lt(prevltp.unitPrice)) {
                    collectionStat.highestBuyEver = ltp.id
                }
            } else {
                collectionStat.highestBuyEver = ltp.id
            }
        }
    }

    assetStat.save()
    collectionStat.save()
}

export function onCancel(event: CancelEvent): void {
    let id = event.transaction.hash.toHexString()
    let orderId = event.params.orderHash.toHexString()

    let order = Order.load(orderId)
    assert(order != null)

    let cancel = new Cancel(id)
    cancel.sellerGetsBackAmount = event.params.sellerGetsBackAmount
    cancel.order = order.id
    cancel.createdAt = event.block.timestamp
    cancel.save()

    order.cancel = cancel.id
    order.active = false
    order.save()


    let balanceId = order.sellAsset.concat("-").concat(order.seller)
    let eb = EscrowBalance.load(balanceId)
    assert(eb != null)
    eb.quantity = eb.quantity.minus(cancel.sellerGetsBackAmount)
    eb.save()
}

export function onPaymentTokenManagerSet(event: PaymentTokenManagerSetEvent): void {
    let address = event.params.paymentTokenManager

    log.info("New payment token manager: {}", [address.toHexString()])

    PaymentTokenManagerContract.create(address);
}

