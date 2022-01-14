import { SubstrateEvent } from '@subql/types'
import { BRIDGE_EXECUTORS } from './executors'

export class BridgeHandler {
  static async checkAndSave(substrateEvent: SubstrateEvent) {
    const {
      event: { method }
    } = substrateEvent
    if (method in BRIDGE_EXECUTORS) {
      await BRIDGE_EXECUTORS[method](substrateEvent)
    } else {
      logger.warn(`Ignore unknown bridge method`)
    }
  }
}
