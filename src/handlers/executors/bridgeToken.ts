import { SubstrateEvent } from '@subql/types'
import { RegisteredBridgeTokens } from '../../types'
import { BridgeType } from '../utils/types'

export const handleBridgeTokenRegistered = async ({
    event: { data },
    block: { timestamp, block: { header } },
    extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
    const [assetId, bridgeTokenId] = JSON.parse(data.toString()) as [number, number]
    const bridgeTokenRecord = RegisteredBridgeTokens.create({
        id: bridgeTokenId.toString(),
        isValid: true,
        assetId,
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
    const [bridgeTokenId] = JSON.parse(data.toString()) as [number, number]
    let bridgeTokenRecord = await RegisteredBridgeTokens.get(bridgeTokenId.toString())
    if (bridgeTokenRecord) {
        bridgeTokenRecord.isValid = false
    } else {
        logger.error(`Cannot update the brigeToken which is not found: ${bridgeTokenId}`)
    }

    try {
        await bridgeTokenRecord.save()
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
            bridgeTokenRecord.bridgeOutTotalAmount = (
                BigInt(bridgeTokenRecord.bridgeOutTotalAmount) + BigInt(amount)
            ).toString()
        } else if (bridgeType === BridgeType.BridgeIn) {
            bridgeTokenRecord.bridgeInCount += 1
            bridgeTokenRecord.bridgeInTotalAmount = (
                BigInt(bridgeTokenRecord.bridgeInTotalAmount) + BigInt(amount)
            ).toString()
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
