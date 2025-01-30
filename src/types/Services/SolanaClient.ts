import { Commitment, LogsCallback, LogsFilter, ParsedTransactionWithMeta, PublicKey } from "@solana/web3.js"

export type FetchTransactionResult = {
    tx: ParsedTransactionWithMeta | null,
    blockchainTry: number
}


export type SubscribeLogsParams = {
    filter: LogsFilter, 
    callback: LogsCallback
    commitment?: Commitment
}