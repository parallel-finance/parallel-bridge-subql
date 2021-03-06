import { SubstrateEvent } from '@subql/types'
import { RegisteredChains } from '../../types'
import { ensureStrNumber } from '../utils/decimal'
import { BridgeType } from '../utils/types'

export const handleChainRegistered = async ({
    event: { data },
    block: { timestamp, block: { header } },
    extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
    const [chainId] = JSON.parse(data.toString()) as [number]
    const chainRecord = RegisteredChains.create({
        id: chainId.toString(),
        bridgeOutCount: 0,
        bridgeOutTotalAmount: '0',
        bridgeInCount: 0,
        bridgeInTotalAmount: '0',
        hash: hash.toString(),
        blockHeight: header.number.toNumber(),
        timestamp,
    })
    logger.info(`#${header.number.toNumber()} handle ChainRegistered ${JSON.stringify(chainRecord)}`)

    try {
        await chainRecord.save()
    } catch (error) {
        logger.error('handle ChainRegistered error: ', error)
    }
}

export const handleChainRemoved = async ({
    event: { data },
    block: { block: { header } }
}: SubstrateEvent) => {
    const [chainId] = JSON.parse(data.toString()) as [number]

    try {
        await RegisteredChains.remove(chainId.toString())
        logger.info(`#${header.number.toNumber()} handle ChainRemoved: ${chainId}`)
    } catch (error) {
        logger.error('handle ChainRemoved error: ', error)
    }
}

export const updateChainSummary = async (chainId: string, amount: string, bridgeType: BridgeType) => {
    let chainRecord = await RegisteredChains.get(chainId)
    if (chainRecord) {
        if (bridgeType === BridgeType.BridgeOut) {
            chainRecord.bridgeOutCount += 1
            chainRecord.bridgeOutTotalAmount = ensureStrNumber((
                BigInt(chainRecord.bridgeOutTotalAmount) + BigInt(amount)
            ).toString())
        } else if (bridgeType === BridgeType.BridgeIn) {
            chainRecord.bridgeInCount += 1
            chainRecord.bridgeInTotalAmount = ensureStrNumber((
                BigInt(chainRecord.bridgeInTotalAmount) + BigInt(amount)
            ).toString())
        }

        logger.info(`update ChainSummary: ${JSON.stringify(chainRecord)}`)
    } else {
        logger.error(`Cannot update the chain which is not found: ${chainId}`)
    }

    try {
        await chainRecord.save()
    } catch (error) {
        logger.error('update ChainSummary error: ', error)
    }
}
