import { SubstrateEvent } from '@subql/types'
import { RegisteredBridgeTokens } from '../../types'
import { ensureStrNumber } from '../utils/decimal'
import { BridgeType } from '../utils/types'

export const handleBridgeTokenRegistered = async ({
    event: { data },
    block: { timestamp, block: { header } },
    extrinsic: { extrinsic: { hash } }
}: SubstrateEvent) => {
    const [assetId, bridgeTokenId, external, fee, enable, outCap, outAmount, inCap, inAmount] =
        JSON.parse(data.toString()) as [number, number, boolean, string, boolean, string, string, string, string]
    const bridgeTokenRecord = RegisteredBridgeTokens.create({
        id: bridgeTokenId.toString(),
        assetId,
        external,
        fee: ensureStrNumber(fee),
        enable,
        outCap: ensureStrNumber(outCap),
        outAmount: ensureStrNumber(outAmount),
        inCap: ensureStrNumber(inCap),
        inAmount: ensureStrNumber(inAmount),
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

export const handleBridgeTokenFeeUpdated = async ({
    event: { data },
    block: { block: { header } }
}: SubstrateEvent) => {
    const [bridgeTokenId, fee] = JSON.parse(data.toString()) as [number, string]
    let bridgeTokenRecord = await RegisteredBridgeTokens.get(bridgeTokenId.toString())
    if (bridgeTokenRecord) {
        bridgeTokenRecord.fee = ensureStrNumber(fee)
    } else {
        logger.error(`cannot update the token which is not found: ${JSON.stringify(bridgeTokenId)}`)
    }

    try {
        await bridgeTokenRecord.save()
        logger.info(`#${header.number.toNumber()} handle BridgeTokenFeeUpdated: ${JSON.stringify(bridgeTokenRecord)}`)
    } catch (error) {
        logger.error(`handle BridgeTokenFeeUpdated error: ${error}`)
    }
}

export const handleBridgeTokenStatusUpdated = async ({
    event: { data },
    block: { block: { header } }
}: SubstrateEvent) => {
    const [bridgeTokenId, enable] = JSON.parse(data.toString()) as [number, boolean]
    let bridgeTokenRecord = await RegisteredBridgeTokens.get(bridgeTokenId.toString())
    if (bridgeTokenRecord) {
        bridgeTokenRecord.enable = enable
    } else {
        logger.error(`cannot update the token which is not found: ${JSON.stringify(bridgeTokenId)}`)
    }

    try {
        await bridgeTokenRecord.save()
        logger.info(`#${header.number.toNumber()} handle BridgeTokenStatusUpdated: ${JSON.stringify(bridgeTokenRecord)}`)
    } catch (error) {
        logger.error(`handle BridgeTokenStatusUpdated error: ${error}`)
    }
}

export const handleBridgeTokenCapUpdated = async ({
    event: { data },
    block: { block: { header } }
}: SubstrateEvent) => {
    const [bridgeTokenId, bridgeType, newCap] = JSON.parse(data.toString()) as [number, string, string]
    let bridgeTokenRecord = await RegisteredBridgeTokens.get(bridgeTokenId.toString())
    if (bridgeTokenRecord) {
        if (bridgeType === 'BridgeIn') bridgeTokenRecord.inCap = ensureStrNumber(newCap)
        else bridgeTokenRecord.outCap = ensureStrNumber(newCap)
    } else {
        logger.error(`cannot update the token which is not found: ${JSON.stringify(bridgeTokenId)}`)
    }

    try {
        await bridgeTokenRecord.save()
        logger.info(`#${header.number.toNumber()} handle BridgeTokenCapUpdated: ${JSON.stringify(bridgeTokenRecord)}`)
    } catch (error) {
        logger.error(`handle BridgeTokenCapUpdated error: ${error}`)
    }
}

export const handleBridgeTokenAccumulatedValueCleaned = async ({
    event: { data },
    block: { block: { header } }
}: SubstrateEvent) => {
    const [bridgeTokenId, bridgeType] = JSON.parse(data.toString()) as [number, string]
    let bridgeTokenRecord = await RegisteredBridgeTokens.get(bridgeTokenId.toString())
    if (bridgeTokenRecord) {
        if (bridgeType === 'BridgeIn') bridgeTokenRecord.inAmount = '0'
        else bridgeTokenRecord.outAmount = '0'
    } else {
        logger.error(`cannot update the token which is not found: ${JSON.stringify(bridgeTokenId)}`)
    }

    try {
        await bridgeTokenRecord.save()
        logger.info(`#${header.number.toNumber()} handle BridgeTokenAccumulatedValueCleaned: ${JSON.stringify(bridgeTokenRecord)}`)
    } catch (error) {
        logger.error(`handle BridgeTokenAccumulatedValueCleaned error: ${error}`)
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
            bridgeTokenRecord.outAmount = ensureStrNumber((
                BigInt(bridgeTokenRecord.outAmount) + BigInt(amount)
            ).toString())
        } else if (bridgeType === BridgeType.BridgeIn) {
            bridgeTokenRecord.bridgeInCount += 1
            bridgeTokenRecord.bridgeInTotalAmount = ensureStrNumber((
                BigInt(bridgeTokenRecord.bridgeInTotalAmount) + BigInt(amount)
            ).toString())
            bridgeTokenRecord.inAmount = ensureStrNumber((
                BigInt(bridgeTokenRecord.inAmount) + BigInt(amount)
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
