import { struct, u8 } from "@solana/buffer-layout"
import { bool, publicKey, u64 } from "@solana/buffer-layout-utils"
import { ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js"
import { getTradeDataWithTransactionParams, Program, TradeData } from "../../types"
import { Raydium } from "../../constants"
import { getTokenDetailsFromTransferInstruction } from "../../utils"

const discriminators = [
    BigInt("16011174931058048655"), //SwapBaseIn
    BigInt("12516711329758894391"), //SwapBaseOut
    BigInt("16316831888147596864") // SwapBaseInput?
]

const logLayout = struct<any>([
    u64("discriminator"),
    publicKey("market"),
    u64("inputVaultBefore"),
    u64("outputVaultBefore"),
    u64("inputAmount"),
    u64("outputAmount"),
    u64("inputTransferFee"),
    u64("outputTransferFee"),
    bool("baseInput"),
])

const logMatch = (log: string) => {

    try{
        if(!log.startsWith("Program data: QMbN6CY")) return false
        const logData = log.split("Program data: ")[1]
        const buffer = Buffer.from(logData,"base64")
        if(buffer.length != 89) return false
        if(!discriminators.includes(logLayout.decode(buffer).discriminator)) return false
        return true
    }catch(_){
        return false
    }

}

const getTradeData = (params: getTradeDataWithTransactionParams) => {

    const { transaction, instruction, index, outerIndex } = params

    const isInnerInstruction = outerIndex !== null

    const user = (instruction as PartiallyDecodedInstruction).accounts[0]

    var sendingInstruction
    var receivingInstruction

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

export const RaydiumCpmmProgram = {
    programId: Raydium.CpmmProgram,
    logMatch,
    getTradeData,
    fetchRequired: true,
    tradeProgram: true
} as Program