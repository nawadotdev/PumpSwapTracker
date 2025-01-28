import { ParsedTransactionWithMeta } from "@solana/web3.js"

export type FetchTransactionResult = {
    tx: ParsedTransactionWithMeta | null,
    blockchainTry: number
}