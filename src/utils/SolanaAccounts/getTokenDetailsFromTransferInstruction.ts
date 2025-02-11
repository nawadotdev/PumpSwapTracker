import { ParsedInstruction, ParsedTransactionWithMeta } from "@solana/web3.js";

export const getTokenDetailsFromTransferInstruction = (
  instruction: ParsedInstruction,
  tx: ParsedTransactionWithMeta
) => {
  let mint: string | undefined;
  let decimals: number | undefined;
  let amount: string | undefined;

  const { type, info } = instruction.parsed;

  if (type === "transferChecked") {
    mint = info.mint;
    amount = info.tokenAmount.amount;
    decimals = info.tokenAmount.decimals;
  } else if (type === "transfer") {
    amount = info.amount;

    const balances = [
      ...(tx.meta?.postTokenBalances || []),
      ...(tx.meta?.preTokenBalances || []),
    ];

    const destination = info.destination;
    const destinationIndex = tx.transaction.message.accountKeys.findIndex(
      (ak) => ak.pubkey === destination
    );

    let balance = balances.find((bal) => bal.accountIndex === destinationIndex);

    if (!balance) {
      const source = info.source;
      const sourceIndex = tx.transaction.message.accountKeys.findIndex(
        (ak) => ak.pubkey === source
      );
      balance = balances.find((bal) => bal.accountIndex === sourceIndex);
    }

    mint = balance?.mint;
    decimals = balance?.uiTokenAmount?.decimals;
  } else {
    console.error("Unknown Instruction:", instruction, tx);
  }

  return { mint, amount, decimals };
};
