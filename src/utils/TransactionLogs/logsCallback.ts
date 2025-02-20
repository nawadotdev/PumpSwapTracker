import {
  Logs,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
import { logParser } from "./logParser";
import { programIdMap } from "../../lib";
import { fetchTransaction } from "../../services/SolanaClient";
import { Program, TradeData } from "../../types";
import { Listener } from "../../services";
import { fetchTokenDetails } from "../../services";

export let SIGNATURE_RECEIVED = 0;
export let SIGNATURE_FETCHED = 0;

export const logsCallback = async (
  _logs: Logs,
  targetMint: PublicKey,
  listener: Listener
) => {
  const { signature, logs, err } = _logs;
  SIGNATURE_RECEIVED++;

  if (
    signature ===
    "1111111111111111111111111111111111111111111111111111111111111111"
  )
    return;
  if (err) return;

  try {
    let tx: ParsedTransactionWithMeta | null = null;
    let trades: TradeData[] = [];
    const groupedLogs = logParser(logs);

    for (let i = 0; i < groupedLogs.length; i++) {
      const groupedLog = groupedLogs[i];
      const programId = groupedLog.programId?.toString();

      if (!programId) continue; // Safeguard

      const program = programIdMap[programId] as Program | undefined;

      if (program && !program.tradeProgram) continue;

      let tradeData: TradeData | null = null;

      if (program?.fetchRequired) {
        if (!groupedLog.logs.some((log) => program.logMatch?.(log))) continue;

        if (!tx) {
          tx = await fetchTransaction(signature);
        }

        const instruction = tx?.transaction.message.instructions[i] ?? null;

        tradeData = program.getTradeData({
          transaction: tx as ParsedTransactionWithMeta,
          instruction: instruction as PartiallyDecodedInstruction,
          index: i,
          outerIndex: null,
        });

        if (
          tradeData &&
          (tradeData?.inputMint?.toString() === targetMint.toString() ||
            tradeData?.outputMint?.toString() === targetMint.toString())
        ) {
          trades.push(tradeData);
        }
      } else if (program && !program.fetchRequired) {
        tradeData = program.getTradeData({
          logs: groupedLog.logs,
        });

        if (
          tradeData &&
          (tradeData?.inputMint?.toString() === targetMint.toString() ||
            tradeData?.outputMint?.toString() === targetMint.toString())
        ) {
          trades.push(tradeData);
        }
      } else {
        let programsInIt: Program[] = [];

        for (const programKey in programIdMap) {
          for (const log of groupedLog.logs) {
            if (programIdMap[programKey]?.logMatch(log)) {
              programsInIt.push(programIdMap[programKey]);
            }
          }
        }

        if (programsInIt.length === 0) continue;

        if (programsInIt.some((p) => p.fetchRequired) && !tx) {
          tx = await fetchTransaction(signature);
        }

        const innerInstructions =
          tx?.meta?.innerInstructions?.find((ix) => ix.index === i)
            ?.instructions ?? [];

        for (let j = 0; j < innerInstructions.length; j++) {
          const innerInstruction = innerInstructions[j];
          const innerProgram = programIdMap[
            innerInstruction.programId?.toString()
          ] as Program | undefined;

          if (innerProgram?.fetchRequired) {
            const tradeData = innerProgram.getTradeData({
              transaction: tx as ParsedTransactionWithMeta,
              instruction: innerInstruction as PartiallyDecodedInstruction,
              index: j,
              outerIndex: i,
            });

            if (tradeData) trades.push(tradeData);
          }
        }
      }
    }

    trades = trades.filter(
      (trade) => trade && (trade.outputMint?.toString() === targetMint.toString())
    );

    if (trades.length === 0) return;

    SIGNATURE_FETCHED++;

    //Fetch the token price
    const tokenPrice = await fetchTokenDetails(targetMint);
    if (tokenPrice === null) return;

    //Filter the trades, if the trade volume is less than 100, ignore it
    trades = trades.filter((trade) => {
      const targetIsBase = trade.inputMint?.toString() === targetMint.toString();
      const _targetAmount = targetIsBase ? trade.inputAmount : trade.outputAmount;
      const targetDecimals = targetIsBase ? trade.inputDecimals : trade.outputDecimals;
      const targetAmount = BigInt(_targetAmount) / BigInt(Math.pow(10, targetDecimals));
      const volume = Number(targetAmount) * (tokenPrice);

      if (volume < 100){
        console.log("Volume less than 100:", signature);
      }

      return volume >= 100;
    });
    
    if (trades.length === 0) return;
    listener.emit(trades, signature);
  } catch (err) {
    console.error("Error in logsCallback:", err);
    console.error("Signature:", signature);
  }
};
