import { SubstrateEvent } from '@subql/types'
import { RegisteredBridgeTokens } from '../../types'
import { ensureStrNumber } from '../utils/decimal'
import { BridgeType } from '../utils/types'

export const handleBridgeTokenRegistered = async ({
    event: { data },
    block: { timestamp, block: { header } },
    extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
    const [assetId, bridgeTokenId, external, fee] =
        JSON.parse(data.toString()) as [number, number, boolean, string]
    const bridgeTokenRecord = RegisteredBridgeTokens.create({
        id: bridgeTokenId.toString(),
        assetId,
        external,
        fee: ensureStrNumber(fee),
        bridgeOutCount: 0,
        bridgeOutTotalAmount: '0',
        bridgeInCount: 0,
        bridgeInTotalAmount: '0',
        hash: hash.toString(),
        blockHeight: header.number.toNumber(),
        timestamp,
    })

    try {
        await bridgeTokenRecord.save()
        logger.info(`#${header.number.toNumber()} handle BridgeTokenRegistered ${JSON.stringify(bridgeTokenRecord)}`)
    } catch (error) {
        logger.error('handle BridgeTokenRegistered error: ', error)
    }
}

export const handleBridgeTokenRemoved = async ({
    event: { data },
    block: { block: { header } }
}: SubstrateEvent) => {
    const [_assetId, bridgeTokenId] = JSON.parse(data.toString()) as [number, number]

    try {
        await RegisteredBridgeTokens.remove(bridgeTokenId.toString())
        logger.info(`#${header.number.toNumber()} handle BridgeTokenRemoved: ${bridgeTokenId}`)
    } catch (error) {
        logger.error('handle BridgeTokenRemoved error: ', error)
    }
}

export const updateBridgeTokenSummary = async (bridgeTokenId: string, amount: string, bridgeType: BridgeType) => {
    let bridgeTokenRecord = await RegisteredBridgeTokens.get(bridgeTokenId)
    if (bridgeTokenRecord) {
        if (bridgeType === BridgeType.BridgeOut) {
            bridgeTokenRecord.bridgeOutCount += 1
            bridgeTokenRecord.bridgeOutTotalAmount = ensureStrNumber((
                BigInt(bridgeTokenRecord.bridgeOutTotalAmount) + BigInt(amount)
            ).toString())
        } else if (bridgeType === BridgeType.BridgeIn) {
            bridgeTokenRecord.bridgeInCount += 1
            bridgeTokenRecord.bridgeInTotalAmount = ensureStrNumber((
                BigInt(bridgeTokenRecord.bridgeInTotalAmount) + BigInt(amount)
            ).toString())
        }

        logger.info(`update BridgeTokenSummary: ${JSON.stringify(bridgeTokenRecord)}`)
    } else {
        logger.error(`Cannot update the bridgeToken which is not found: ${bridgeTokenId}`)
    }

    try {
        await bridgeTokenRecord.save()
    } catch (error) {
        logger.error('update BridgeTokenSummary error: ', error)
    }
}
