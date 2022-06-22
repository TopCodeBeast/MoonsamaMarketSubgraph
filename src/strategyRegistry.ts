import { log } from '@graphprotocol/graph-ts'
import {
    StrategyChanged as StrategyChangedEvent,
} from '../generated/StrategyRegistry/StrategyRegistry'
import { StrategyType } from '../generated/schema'
import { SimpleOrderStrategyContract } from '../generated/templates'
import { strategyMap } from './utils'


export function onStrategyChanged(event: StrategyChangedEvent): void {
    let id = event.params.id.toHexString()
    let strategy = StrategyType.load(id)
    if (strategy == null) {
        log.info("new strategy added: {}",[id]);
        strategy = new StrategyType(id)
        strategy.createdAt = event.block.timestamp
    }
    let strategyAddress = event.params.newStrategy
    strategy.address = strategyAddress.toHexString()
    strategy.save()

    log.info("strategy {} address set to {}",[id, strategy.address]);

    let simpleS = strategyMap('SIMPLE')
    log.debug("RECEIVED/SIMPLE {}/{}",[strategy.id, simpleS])
    if (simpleS == strategy.id ) {
        log.debug("SIMPLE STRATEGY BEING SET",[]);
        SimpleOrderStrategyContract.create(strategyAddress);
    }
}
