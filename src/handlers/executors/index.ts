import { SubstrateEvent } from '@subql/types'
import { handleChainRegistered, handleChainRemoved } from './chain'
import { handleBridgeTokenRegistered, handleBridgeTokenRemoved } from './bridgeToken'
import { handleMaterializeInitialized, handleMaterializeMinted, handleTeleportBurned } from './bridgeTx'
import { handleVoteAgainst, handleVoteFor } from './vote'

export type Executor = (event: SubstrateEvent) => Promise<void>

export const BRIDGE_EXECUTORS: { [method: string]: Executor } = {
  ['ChainRegistered']: handleChainRegistered,
  ['ChainRemoved']: handleChainRemoved,
  ['BridgeTokenRegistered']: handleBridgeTokenRegistered,
  ['BridgeTokenRemoved']: handleBridgeTokenRemoved,
  ['TeleportBurned']: handleTeleportBurned,
  ['MaterializeInitialized']: handleMaterializeInitialized,
  ['MaterializeMinted']: handleMaterializeMinted,
  ['VoteFor']: handleVoteFor,
  ['VoteAgainst']: handleVoteAgainst,
}
