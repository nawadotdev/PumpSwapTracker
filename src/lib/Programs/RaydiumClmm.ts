import { Layout, struct, u8 } from "@solana/buffer-layout"
import { bool, u64 } from "@solana/buffer-layout-utils"
import { ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js"
import { getTradeDataWithTransactionParams, Program, TradeData } from "../../types"
import { Raydium } from "../../constants"
import { getTokenDetailsFromTransferInstruction } from "../../utils"

const logLayout = struct<any>([
    u64("discriminator"),
    u64("amount"),
    u64("other_amount_threshold"),
    u64("sqrt_price_limit_x64"),
    bool("is_base_input"),
])

const logMatch = (log: string) => {

    try {
        if(!log.startsWith("Program data: QMbN6CY")) return false
        const logData = log.split("Program data: ")[1]
        const buffer = Buffer.from(logData,"base64")
        if(buffer.length != 205) return false
        return true
    } catch (_) {
        return false
    }

}

const getTradeData = (params: getTradeDataWithTransactionParams) => {

    const { transaction, instruction, index, outerIndex } = params

    const isInnerInstruction = outerIndex !== null

    const user = (instruction as PartiallyDecodedInstruction).accounts[0]

    var sendingInstruction: ParsedInstruction
    var receivingInstruction: ParsedInstruction

    if (isInnerInstruction) {

        const innerInstructions = transaction.meta?.innerInstructions?.find(ix => ix.index == outerIndex)

        sendingInstruction = innerInstructions?.instructions[index + 1] as ParsedInstruction
        receivingInstruction = innerInstructions?.instructions[index + 2] as ParsedInstruction

    } else {

        const innerInstructions = transaction.meta?.innerInstructions?.find(ix => ix.index == index)

        sendingInstruction = innerInstructions?.instructions[0] as ParsedInstruction
        receivingInstruction = innerInstructions?.instructions[1] as ParsedInstruction

    }

    const { mint: sendingMint, amount: sendingAmount, decimals: sendingDecimals } = getTokenDetailsFromTransferInstruction(
        sendingInstruction,
        transaction
    )

    const { mint: receivingMint, amount: receivingAmount, decimals: receivingDecimals } = getTokenDetailsFromTransferInstruction(
        receivingInstruction,
        transaction
    )

    return {
        user,
        inputMint: sendingMint,
        outputMint: receivingMint,
        inputAmount: sendingAmount,
        outputAmount: receivingAmount,
        inputDecimals: sendingDecimals,
        outputDecimals: receivingDecimals
    } as TradeData
}

export const RaydiumClmmProgram = {
    programId: Raydium.ClmmProgram,
    logMatch,
    getTradeData,
    fetchRequired: true,
    tradeProgram: true
} as Program