import { Logs, ParsedTransactionMeta, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from "@solana/web3.js";
import { logParser } from "./logParser";
import { programIdMap } from "../../lib";
import { fetchTransaction } from "../../services";
import { Program } from "../../types";

export const logsCallback = async (_logs: Logs) => {

    const { signature, logs, err } = _logs;

    if(signature == "1111111111111111111111111111111111111111111111111111111111111111") return
    if (err) return

    try{
        var tx: ParsedTransactionWithMeta | null = null

        const grouppedLogs = logParser(logs)
    
        for (let i = 0; i < grouppedLogs.length; i++) {
            const program = programIdMap[grouppedLogs[i].programId.toString()] as Program
            if (program && !program.tradeProgram) continue
            if (program && program.fetchRequired) {
                if(!(grouppedLogs[i].logs.some(log => program.logMatch(log)))) continue
                if (!tx) {
                    tx = (await fetchTransaction(signature))
                }
                const instruction = tx?.transaction.message.instructions[i]
                const tradeData = (program as Program).getTradeData({
                    transaction: tx as ParsedTransactionWithMeta,
                    instruction: instruction as PartiallyDecodedInstruction,
                    index: i,
                    outerIndex: null
                })
                console.log(tradeData)
                //console.log(signature)
            } else if (program && !program.fetchRequired) {
                const tradeData = (program as Program).getTradeData({ logs: grouppedLogs[i].logs })
                //console.log(tradeData)
                //console.log(signature)
            } else {
                const groupedLog = grouppedLogs[i]
                var programsInIt : Program[] = []
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
                        console.log(tradeData)
                    }else continue
                }
            }
        }
    }catch(err){
        console.log(err)
        console.log(signature)
    }





}