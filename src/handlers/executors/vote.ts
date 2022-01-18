import { SubstrateEvent } from '@subql/types'
import { Votes } from '../../types'
import { aggregateIntoId, updateProposal } from './bridgeTx'

export const handleVoteFor = async ({
    event: { data },
    block: { timestamp, block: { header } },
    extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
    const [sourceId, sourceNonce, voter] = JSON.parse(
        data.toString()
    ) as [number, number, string]

    let voteRecord = Votes.create({
        id: aggregateIntoId(sourceId.toString(), sourceNonce.toString()),
        sourceChainId: sourceId,
        chainNonce: sourceNonce,
        voter,
        favor: true,
        hash: hash.toString(),
        blockHeight: header.number.toNumber(),
        timestamp,
    });

    try {
        await voteRecord.save()

        await updateProposal(aggregateIntoId(sourceId.toString(), sourceNonce.toString()), true)
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
    const [sourceId, sourceNonce, voter] = JSON.parse(
        data.toString()
    ) as [number, number, string]

    let voteRecord = Votes.create({
        id: aggregateIntoId(sourceId.toString(), sourceNonce.toString()),
        sourceChainId: sourceId,
        chainNonce: sourceNonce,
        voter,
        favor: false,
        hash: hash.toString(),
        blockHeight: header.number.toNumber(),
        timestamp,
    });

    try {
        await voteRecord.save()
        await updateProposal(aggregateIntoId(sourceId.toString(), sourceNonce.toString()), false)
        logger.info(`#${header.number.toNumber()} handle VoteFor ${JSON.stringify(voteRecord)}`)
    } catch (error) {
        logger.error('handle VoteFor error: ', error)
    }
}