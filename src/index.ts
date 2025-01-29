import { ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js";
import { Connection } from "./services";
import dotenv from "dotenv";
import {fetchTransaction} from "./services";
import { logParser } from "./utils";
import {programIdMap} from "./lib";
import { Program } from "./types";
import { writeFileSync } from "fs";
import { subscribeLogs } from "./services/SolanaClient/subscribeLogs";
import { logsCallback } from "./utils/TransactionLogs/logsCallback";

dotenv.config();

fetchTransaction("4rbqirBpEy454FHkT5vPtX3hN1djh4GWdsDteo2t1hUtntipejw4y2nd5YFdCkt1TNvFDvfm7Pi68e1JZJ8ji9Z6").then((tx) => {
    writeFileSync("tx.json", JSON.stringify(tx))
    const logs = tx?.meta?.logMessages || []
    const err = null
    const signature = tx?.transaction.signatures[0]

    logsCallback({
        logs,
        err,
        signature : signature as string
    })

})

// subscribeLogs({
//     filter : new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"),
//     callback: logsCallback,
//     commitment: "confirmed"
// })
