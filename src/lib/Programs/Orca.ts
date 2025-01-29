import {  ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js"
import { getTradeDataWithTransactionParams, Program, TradeData } from "../../types"
import { getTokenDetailsFromTransferInstruction } from "../../utils"
import { Orca, Solana } from "../../constants"

const logMatch = (log: string) => {

    try{
        if(!log.startsWith(" Program log: fee_growth: ")) return true
        return false
    }catch(_){
        return false
    }

}

const getTradeData = (params : getTradeDataWithTransactionParams) => {

    const { transaction, instruction, index, outerIndex } = params
    
    if((instruction as PartiallyDecodedInstruction).accounts[0]?.toString() != Solana.TokenProgram.toString()) return null

    const isInnerInstruction = outerIndex !== null
    
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
    
    const user = sendingInstruction.parsed.info.authority


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

export const OrcaProgram = {
    programId: Orca.Program,
    logMatch,
    getTradeData,
    fetchRequired : true,
    tradeProgram : true
} as Program