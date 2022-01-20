import { SubstrateEvent } from '@subql/types'
import { Votes } from '../../types'
import { useAnyChainAddress } from '../utils/address'
import { ensureStrNumber } from '../utils/decimal'
import { aggregateIntoId, updateProposal } from './bridgeTx'

export const handleVoteFor = async ({
    event: { data },
    block: { timestamp, block: { header } },
    extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
    const [sourceId, sourceNonce, voter, bridgeTokenId, dstAddress, amount] = JSON.parse(
        data.toString()
    ) as [number, number, string, number, string, string]

    let voteRecord = Votes.create({
        id: aggregateIntoId(sourceId.toString(), sourceNonce.toString(), voter),
        sourceChainId: sourceId,
        chainNonce: sourceNonce,
        voter: useAnyChainAddress(voter),
        bridgeTokenId,
        dstAddress: useAnyChainAddress(dstAddress),
        amount: ensureStrNumber(amount),
        favor: true,
        hash: hash.toString(),
        blockHeight: header.number.toNumber(),
        timestamp,
    });

    try {
        await voteRecord.save()
        const proposal = aggregateIntoId(sourceId.toString(), sourceNonce.toString(), voter)
        await updateProposal(proposal, true)
        logger.info(`#${header.number.toNumber()} handle VoteFor ${JSON.stringify(voteRecord)}`)
    } catch (error) {
        logger.error('handle VoteFor error: ', error)
    }
}

export const handleVoteAgainst = async ({
    event: { data },
    block: { timestamp, block: { header } },
    extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
    const [sourceId, sourceNonce, voter, bridgeTokenId, dstAddress, amount] = JSON.parse(
        data.toString()
    ) as [number, number, string, number, string, string]

    let voteRecord = Votes.create({
        id: aggregateIntoId(sourceId.toString(), sourceNonce.toString(), voter),
        sourceChainId: sourceId,
        chainNonce: sourceNonce,
        voter: useAnyChainAddress(voter),
        bridgeTokenId,
        dstAddress: useAnyChainAddress(dstAddress),
        amount: ensureStrNumber(amount),
        favor: false,
        hash: hash.toString(),
        blockHeight: header.number.toNumber(),
        timestamp,
    });

    try {
        await voteRecord.save()
        const proposal = aggregateIntoId(sourceId.toString(), sourceNonce.toString(), voter)
        await updateProposal(proposal, false)
        logger.info(`#${header.number.toNumber()} handle VoteFor ${JSON.stringify(voteRecord)}`)
    } catch (error) {
        logger.error('handle VoteFor error: ', error)
    }
}