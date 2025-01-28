import { ParsedInnerInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js"

export type Program = {
    programId: PublicKey,
    fetchRequired : boolean,
    tradeProgram : boolean,
    getTradeData : (params : getTradeDataWithTransactionParams | getTradeDataWithLogsParams) => TradeData | null,
    logMatch : (log: string) => boolean
}

export type getTradeDataWithTransactionParams = {
    transaction : ParsedTransactionWithMeta,
    instruction : ParsedInnerInstruction | PartiallyDecodedInstruction,
    index : number,
    outerIndex : number | null
} 

export type getTradeDataWithLogsParams = {
    logs : string[]
}


export type TradeData = {
    user : PublicKey | string,
    inputMint : PublicKey | string,
    outputMint : PublicKey | string,
    inputAmount : string,
    outputAmount : string,
    inputDecimals : number,
    outputDecimals : number,
}