import { Logs, ParsedTransactionMeta, ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js";
import { logParser } from "./logParser";
import { programIdMap } from "../../lib";
import { fetchTransaction } from "../../services/SolanaClient";
import { Program, TradeData } from "../../types";
import { Listener } from "../../services/TrackingService";

export let SIGNATURE_RECEIVED = 0
export let SIGNATURE_FETCHED = 0

export const logsCallback = async (_logs: Logs, targetMint: PublicKey, listener: Listener) => {

    const { signature, logs, err } = _logs;
    SIGNATURE_RECEIVED++
    if(signature == "1111111111111111111111111111111111111111111111111111111111111111") return
    if (err) return
    try{
        let tx: ParsedTransactionWithMeta | null = null
        let trades : (TradeData | null)[] = []
        const grouppedLogs = logParser(logs)
        for (let i = 0; i < grouppedLogs.length; i++) {
            let tradeData = null
            const program = programIdMap[grouppedLogs[i].programId.toString()] as Program
            if (program && !program.tradeProgram) continue
            if (program && program.fetchRequired) {
                if(!(grouppedLogs[i].logs.some(log => program.logMatch(log)))) continue
                if (!tx) {
                    tx = (await fetchTransaction(signature))
                }
                const instruction = tx?.transaction.message.instructions[i]
                tradeData = (program as Program).getTradeData({
                    transaction: tx as ParsedTransactionWithMeta,
                    instruction: instruction as PartiallyDecodedInstruction,
                    index: i,
                    outerIndex: null
                })
                if(tradeData && (tradeData.inputMint.toString() == targetMint.toString() || tradeData.outputMint.toString() == targetMint.toString())) trades.push(tradeData)
            } else if (program && !program.fetchRequired) {
                tradeData = (program as Program).getTradeData({ logs: grouppedLogs[i].logs })
                trades.push(tradeData)
                if(tradeData && (tradeData.inputMint.toString() == targetMint.toString() || tradeData.outputMint.toString() == targetMint.toString())) trades.push(tradeData)
            } else {
                const groupedLog = grouppedLogs[i]
                let programsInIt : Program[] = []
                for(let program in programIdMap){
                    for(let log of groupedLog.logs){
                        if(programIdMap[program]?.logMatch(log)){
                            programsInIt.push(programIdMap[program])
                        }
                    }
                }
                if(programsInIt.length == 0) continue
                if(programsInIt.some(p => p.fetchRequired) && !tx){
                    tx = (await fetchTransaction(signature))
                }
                const innerInstructions = tx?.meta?.innerInstructions?.find(ix => ix.index == i)?.instructions || []
                for(let j = 0; j<innerInstructions.length;j++){
                    const innerInstruction = innerInstructions[j]
                    const program = programIdMap[innerInstruction.programId.toString()] as Program
                    if(program && program.fetchRequired){
                        const tradeData = program.getTradeData({
                            transaction: tx as ParsedTransactionWithMeta,
                            instruction: innerInstruction as PartiallyDecodedInstruction,
                            index: j,
                            outerIndex: i
                        }) 
                         
                    trades.push(tradeData)
                    }else continue
                }
            }
        }
        trades = trades.filter(trade => trade != null && (trade.inputMint.toString() == targetMint.toString() || trade.outputMint.toString() == targetMint.toString()))
        //if(tx != null && trades.length == 0) console.log(signature)
        if(trades.length == 0) return
        SIGNATURE_FETCHED++
        //console.log(trades, signature)
        listener.emit(trades, signature)
    }catch(err){
        console.log(err)
        console.log(signature)
    }



}