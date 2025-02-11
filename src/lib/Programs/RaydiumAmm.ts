import { struct, u8 } from "@solana/buffer-layout"
import { u64 } from "@solana/buffer-layout-utils"
import {  ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js"
import { getTradeDataWithTransactionParams, Program, TradeData } from "../../types"
import { Raydium } from "../../constants"
import { getTokenDetailsFromTransferInstruction } from "../../utils"

const logLayout = struct<any>([
    u8("log_type")  ,
    u64("amount_in"),
    u64("minimum_out"),
    u64("direction"),
    u64("user_source"),
    u64("pool_coin"),
    u64("pool_pc"),
    u64("out_amount"),
])

const logMatch = (log: string) => {

    try{
        if(!log.startsWith("Program log: ray_log: ")) return false
        const logData = log.split("ray_log: ")[1]
        const data = logLayout.decode(Buffer.from(logData,"base64"))
        if(data.log_type != 3 && data.log_type != 4) return false
        return true
    }catch(_){
        return false
    }

}

const getTradeData = (params : getTradeDataWithTransactionParams) => {

    const { transaction, instruction, index, outerIndex } = params

    const isInnerInstruction = outerIndex !== null
    const user = (instruction as PartiallyDecodedInstruction).accounts[16]

    let sendingInstruction : ParsedInstruction
    let receivingInstruction : ParsedInstruction

    if(isInnerInstruction){

        const innerInstructions = transaction.meta?.innerInstructions?.find(ix => ix.index == outerIndex)

        sendingInstruction = innerInstructions?.instructions[index+1] as ParsedInstruction
        receivingInstruction = innerInstructions?.instructions[index+2] as ParsedInstruction

    }else{

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
        inputMint : sendingMint,
        outputMint : receivingMint,
        inputAmount : sendingAmount,
        outputAmount : receivingAmount,
        inputDecimals : sendingDecimals,
        outputDecimals : receivingDecimals
    } as TradeData
}

export const RaydiumAmmProgram = {
    programId: Raydium.LegacyAmmV4Program,
    logMatch,
    getTradeData,
    fetchRequired : true,
    tradeProgram : true
} as Program