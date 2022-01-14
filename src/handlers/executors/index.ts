import { SubstrateEvent } from '@subql/types'
import { handleChainRegistered, handleChainRemoved } from './chain'
import { handleBridgeTokenRegistered, handleBridgeTokenRemoved } from './bridge-token'

export type Executor = (event: SubstrateEvent) => Promise<void>

export const BRIDGE_EXECUTORS: { [method: string]: Executor } = {
  ['ChainRegistered']: handleChainRegistered,
  ['ChainRemoved']: handleChainRemoved,
  ['BridgeTokenRegistered']: handleBridgeTokenRegistered,
  ['BridgeTokenRemoved']: handleBridgeTokenRemoved,
}
