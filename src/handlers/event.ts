import { SubstrateEvent } from '@subql/types'
import { BridgeHandler } from './bridge'

export class EventHandler {
  private event: SubstrateEvent

  constructor(event: SubstrateEvent) {
    this.event = event
  }

  public async save() {
    await BridgeHandler.checkAndSave(this.event)
  }
}
