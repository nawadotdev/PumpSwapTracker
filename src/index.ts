import { ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js";
import { Connection } from "./services";
import dotenv from "dotenv";
import { fetchTransaction } from "./services";
import { logParser } from "./utils";
import { programIdMap } from "./lib";
import { Program } from "./types";
import { writeFileSync } from "fs";
import { subscribeLogs } from "./services/SolanaClient/subscribeLogs";
import { logsCallback } from "./utils/TransactionLogs/logsCallback";
import { Server } from "socket.io";
import http from "http";
import { Listener } from "./services/TrackingService";
import { Client } from "./types/Services/TrackingService";

dotenv.config();

// fetchTransaction("22ukj1Y8AW57ov8Fc7y6cmSRDpqcUstGZ4RQ2pxv58CC38phRp1X4kvBd5bZH7uF4PLicN2yvmMxNzKqXkwvNe4M").then((tx) => {
//     writeFileSync("tx.json", JSON.stringify(tx))
//     const _logs = tx?.meta?.logMessages || []
//     const err = null
//     const signature = tx?.transaction.signatures[0] as string

//     logsCallback(
//         {
//             logs : _logs,
//             err,
//             signature
//         },
//         new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN")
//     )

// })

// subscribeLogs({
//     filter: new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"),
//     callback: (logs) => logsCallback(logs, new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"), new Listener(new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"))),
//     commitment: "confirmed",
// })

const listeners: Listener[] = []

const httpServer = http.createServer();
const io = new Server(httpServer,
    {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    }
)

io.on("connection", (socket) => {

    //console.log(`${socket.id} connected.`)

    const client: Client = {
        socket: socket,
        subscriptions: [] as PublicKey[],
    } as Client

    socket.on("subscribe", (tokenAddress: string) => {


        try {
            var coinAddress = new PublicKey(tokenAddress)
        } catch (_) {
            socket.emit("error", "Invalid token address")
            return
        }

        if (client.subscriptions.includes(coinAddress)) {
            socket.emit("error", "Already subscribed to this token")
            return
        }

        const existingListener = listeners.find(l => l.getTokenAddress().equals(coinAddress))

        if (existingListener) {
            existingListener.addClient(client)
            client.subscriptions.push(coinAddress)
            socket.emit("subscribed", coinAddress.toString())
            return
        }

        const listener = new Listener(coinAddress)
        console.log(listener)
        listener.addClient(client)
        listeners.push(listener)
        client.subscriptions.push(coinAddress)
        socket.emit("subscribed", coinAddress.toString())

    })

    socket.on("unsubscribe", (tokenAddress: String) => {

        try {
            var coinAddress = new PublicKey(tokenAddress)
        } catch (_) {
            socket.emit("error", "Invalid token address")
            return
        }

        if (!client.subscriptions.includes(coinAddress)) {
            socket.emit("error", "Not subscribed to this token")
            return
        }

        const listener = listeners.find(l => l.getTokenAddress().equals(coinAddress))

        if (!listener) {
            socket.emit("error", "Listener not found")
            return
        }

        var listenerClosed = listener.removeClient(client)
        client.subscriptions = client.subscriptions.filter(s => !s.equals(coinAddress))

        socket.emit("unsubscribed", coinAddress.toString())

        if (listenerClosed) {
            listeners.splice(listeners.indexOf(listener), 1)
        }

        

    })

    socket.on("disconnect", () => {
        console.log(`⚠️ ${socket.id} disconnected.`);
        for (let listener of listeners) {
            listener.removeClient(client)
        }
      });

})

httpServer.listen(3001, () => {
    console.log("Listening on port 3001")
})