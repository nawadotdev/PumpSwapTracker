import { ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js";
import { Connection } from "./services";
import dotenv from "dotenv";
import {fetchTransaction} from "./services";
import { logParser } from "./utils";
import {programIdMap} from "./lib";
import { Program } from "./types";
import { writeFileSync } from "fs";
dotenv.config();

fetchTransaction("2p8FWgeNfckMJLDU629SnJAZnAswwrXQpVKdERHLoTBF1yyf9xfo4nAhau4HCD2WPeYhiuvKaYk4c2eF4FppUerw").then(res => res.tx).then((tx) => {
    //writeFileSync("tx.json", JSON.stringify(tx))
    const logs = tx?.meta?.logMessages || []
    const err = null
    const signature = tx?.transaction.signatures[0]
    const grouppedLogs = logParser(logs)

    for(let i = 0; i<grouppedLogs.length; i++){
        const program = programIdMap[grouppedLogs[i].programId.toString()] as Program
        if(program && !program.tradeProgram) continue
        if(program && program.fetchRequired){
            const instruction = tx?.transaction.message.instructions[i]
            const tradeData = (program as Program).getTradeData({
                transaction : tx as ParsedTransactionWithMeta,
                instruction : instruction as PartiallyDecodedInstruction,
                index : i,
                outerIndex : null
            })
            console.log(tradeData)
        }else if(program && !program.fetchRequired){
            const tradeData = (program as Program).getTradeData({logs : grouppedLogs[i].logs})
            console.log(tradeData)
        }
    }

})