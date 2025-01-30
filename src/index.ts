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

fetchTransaction("22ukj1Y8AW57ov8Fc7y6cmSRDpqcUstGZ4RQ2pxv58CC38phRp1X4kvBd5bZH7uF4PLicN2yvmMxNzKqXkwvNe4M").then((tx) => {
    writeFileSync("tx.json", JSON.stringify(tx))
    const _logs = tx?.meta?.logMessages || []
    const err = null
    const signature = tx?.transaction.signatures[0] as string

    logsCallback(
        {
            logs : _logs,
            err,
            signature
        },
        new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN")
    )

})

// subscribeLogs({
//     filter: new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"),
//     callback: (logs) => logsCallback(logs, new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN")),
//     commitment: "confirmed",
// })
