import { log } from '@graphprotocol/graph-ts'
import {
    SimpleOrderStrategyCreated as SimpleOrderStrategyCreatedEvent,
} from '../generated/templates/SimpleOrderStrategyContract/SimpleOrderStrategy'
import { Order } from '../generated/schema'
import { getPPU } from './utils'

export function onSimpleOrderStrategyCreated(event: SimpleOrderStrategyCreatedEvent): void {
    let id = event.params.orderHash.toHexString()

    log.debug("NEW SIMPLE ORDER ", [id])

    
    let order = Order.load(id)
    if (order == null) {
        log.debug("ORDER WAS NOT FOUND YET {}", [id])
        order = new Order(id)
    } else {
        // we have access to orderType so the ppu can be calculated
        order.pricePerUnit = getPPU(order.orderType, event.params.askPerUnitNominator, event.params.askPerUnitDenominator)
    }
    /*
    assert(order != null)

    order.strategy = strategy.id
    order.save()
    */

    order.quantity = event.params.quantity
    order.quantityLeft = event.params.quantity
    order.startsAt = event.params.startsAt
    order.expiresAt = event.params.expiresAt
    order.askPerUnitNominator = event.params.askPerUnitNominator
    order.askPerUnitDenominator = event.params.askPerUnitDenominator
    order.onlyTo = event.params.onlyTo.toHexString()
    order.partialAllowed = event.params.partialAllowed
    order.save()


    /*
    let sellAsset = Asset.load(order.sellAsset)
    assert(sellAsset != null)

    let balanceId =  sellAsset.id.concat("-").concat(order.seller)
    let eb = EscrowBalance.load(balanceId)
    assert(eb != null)
    eb.quantity = eb.quantity + strategy.quantity
    eb.save()
    */
}
