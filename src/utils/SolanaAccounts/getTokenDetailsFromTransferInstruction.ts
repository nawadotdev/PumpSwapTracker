import { ParsedInnerInstruction, ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from "@solana/web3.js";

export const getTokenDetailsFromTransferInstruction = (
    instruction: (ParsedInstruction),
    tx: ParsedTransactionWithMeta
) => {

    let mint
    let decimals
    let amount


    if (instruction.parsed.type == "transferChecked") {

        mint = instruction.parsed.info.mint
        amount = instruction.parsed.info.tokenAmount.amount
        decimals = instruction.parsed.info.tokenAmount.decimals

    } else if (instruction.parsed.type == "transfer") {

        amount = instruction.parsed.info.amount
        const balances = [...tx.meta?.postTokenBalances || [], ...tx.meta?.preTokenBalances || []]
        const destination = instruction.parsed.info.destination
        const destionationIndex = tx.transaction.message.accountKeys.findIndex(ak => ak.pubkey == destination)
        let balance = balances.find(bal => bal.accountIndex == destionationIndex)
        if (!balance) {

            const source = instruction.parsed.info.source
            const sourecIndex = tx.transaction.message.accountKeys.findIndex(ak => ak.pubkey == source)
            balance = balances.find(bal => bal.accountIndex == sourecIndex)

        }

        mint = balance?.mint
        decimals = balance?.uiTokenAmount.decimals



    } else {
        console.log("Unkown Instruction")
        console.log(instruction)
        console.log(tx)
    }

    return {
        mint,
        amount,
        decimals
    }

}