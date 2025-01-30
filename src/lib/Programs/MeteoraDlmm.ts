import {  ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js"
import { getTradeDataWithTransactionParams, Program, TradeData } from "../../types"
import { getTokenDetailsFromTransferInstruction } from "../../utils"
import { Meteora } from "../../constants"

const logMatch = (log: string) => {

    try{
        if(log.startsWith(`Program ${Meteora.DlmmProgram} consumed 2134`)) return true
        return false
    }catch(_){
        return false
    }

}

const getTradeData = (params : getTradeDataWithTransactionParams) => {

    const { transaction, instruction, index, outerIndex } = params

    if((instruction as PartiallyDecodedInstruction).accounts[1]?.toString() != Meteora.DlmmProgram.toString()) return null

    const isInnerInstruction = outerIndex !== null
    const user = (instruction as PartiallyDecodedInstruction).accounts[16]


    
    var sendingInstruction : ParsedInstruction
    var receivingInstruction : ParsedInstruction

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

export const MeteoraDlmmProgram = {
    programId: Meteora.DlmmProgram,
    logMatch,
    getTradeData,
    fetchRequired : true,
    tradeProgram : true
} as Program