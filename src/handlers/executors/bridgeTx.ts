import { SubstrateEvent } from '@subql/types'
import { BridgeIn, BridgeOut } from '../../types'
import { useAnyChainAddress } from '../utils/address'
import { updateChainSummary } from './chain'
import { BridgeType, ProposalStatus } from '../utils/types'
import { updateBridgeTokenSummary } from './bridgeToken'
import { ensureStrNumber } from '../utils/decimal'

export function aggregateIntoId(chainId: string, chainNonce: string, account: string) {
  return chainId + '-' + chainNonce + '-' + useAnyChainAddress(account)
}

export const handleTeleportBurned = async ({
  event: { data },
  block: { timestamp, block: { header } },
  extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
  const [oriAddress, destId, chainNonce, bridgeTokenId, dstAddress, amount, fee] = JSON.parse(
    data.toString()
  ) as [string, number, number, number, string, string, string]

  const bridgeOutRecord = BridgeOut.create({
    id: aggregateIntoId(destId.toString(), chainNonce.toString(), oriAddress),
    isValid: true,
    oriAddress: useAnyChainAddress(oriAddress),
    destChainId: destId,
    chainNonce,
    bridgeTokenId,
    dstAddress,
    amount: ensureStrNumber(amount),
    fee: ensureStrNumber(fee),
    hash: hash.toString(),
    blockHeight: header.number.toNumber(),
    timestamp: timestamp
  })
  logger.info(`handle TeleportBurned ${JSON.stringify(bridgeOutRecord)}`)

  try {
    await bridgeOutRecord.save()

    // Update summary if `TeleportBurned` happends
    await updateChainSummary(destId.toString(), amount, BridgeType.BridgeOut)
    await updateBridgeTokenSummary(bridgeTokenId.toString(), amount, BridgeType.BridgeOut)
  } catch (error) {
    logger.error('handle TeleportBurned error: ', error)
  }
}

export const handleMaterializeInitialized = async ({
  event: { data },
  block: { timestamp, block: { header } },
  extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
  const [_voter, sourceId, sourceNonce, bridgeTokenId, dstAddress, amount] = JSON.parse(
    data.toString()
  ) as [string, number, number, number, string, string]

  const bridgeInRecord = BridgeIn.create({
    id: aggregateIntoId(sourceId.toString(), sourceNonce.toString(), dstAddress),
    isValid: false,
    sourceChainId: sourceId,
    chainNonce: sourceNonce,
    bridgeTokenId,
    dstAddress: useAnyChainAddress(dstAddress),
    amount: ensureStrNumber(amount),
    voteFor: 0,
    voteAgainst: 0,
    proposalStatus: ProposalStatus.Initiated.valueOf(),
    hash: hash.toString(),
    blockHeight: header.number.toNumber(),
    executedBlockHeight: null,
    timestamp: timestamp
  })
  logger.info(`handle MaterializeInitialized ${JSON.stringify(bridgeInRecord)}`)

  try {
    await bridgeInRecord.save()
  } catch (error) {
    logger.error('handle MaterializeInitialized error: ', error)
  }
}

export const handleMaterializeMinted = async ({
  event: { data },
  block: { block: { header } }
}: SubstrateEvent) => {
  const [sourceId, sourceNonce, bridgeTokenId, dstAddress, amount] = JSON.parse(
    data.toString()
  ) as [number, number, number, string, string]

  const bridgeInId = aggregateIntoId(sourceId.toString(), sourceNonce.toString(), dstAddress)
  let bridgeInRecord = await BridgeIn.get(bridgeInId)
  if (bridgeInRecord) {
    bridgeInRecord.isValid = true
    bridgeInRecord.proposalStatus = ProposalStatus.Approved.valueOf()
    bridgeInRecord.executedBlockHeight = header.number.toNumber()
  } else {
    logger.error(`Cannot update the bridgeToken which is not found: ${bridgeInId}`)
  }

  try {
    await bridgeInRecord.save()

    // Update summary if `MaterializeMinted` happends
    await updateChainSummary(sourceId.toString(), amount, BridgeType.BridgeIn)
    await updateBridgeTokenSummary(bridgeTokenId.toString(), amount, BridgeType.BridgeIn)

    logger.info(`#${header.number.toNumber()} handle MaterializeMinted: ${JSON.stringify(bridgeInRecord)}`)
  } catch (error) {
    logger.error('handle MaterializeMinted error: ', error)
  }
}

export const updateProposal = async (proposal: string, favor: boolean) => {
  let bridgeInRecord = await BridgeIn.get(proposal)
  if (bridgeInRecord) {
    if (!bridgeInRecord.voteFor && !bridgeInRecord.voteAgainst) {
      bridgeInRecord.proposalStatus = ProposalStatus.Voting.valueOf()
    }
    bridgeInRecord.voteFor += (favor ? 1 : 0)
    bridgeInRecord.voteAgainst += (favor ? 0 : 1)
  } else {
    logger.error(`Cannot update the proposal which is not found: ${proposal}`)
  }

  try {
    await bridgeInRecord.save()

    logger.info(`update Proposal: ${JSON.stringify(bridgeInRecord)}`)
  } catch (error) {
    logger.error('update Proposal error: ', error)
  }
}
