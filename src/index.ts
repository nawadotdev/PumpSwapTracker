import { ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js";
import { Connection, RATE_LIMITED } from "./services";
import dotenv from "dotenv";
import { fetchTransaction } from "./services";
import { logParser } from "./utils";
import { programIdMap } from "./lib";
import { Program } from "./types";
import { writeFileSync } from "fs";
import { subscribeLogs } from "./services/SolanaClient/subscribeLogs";
import { logsCallback, SIGNATURE_FETCHED, SIGNATURE_RECEIVED } from "./utils/TransactionLogs/logsCallback";
import { Server } from "socket.io";
import http from "http";
import { Listener } from "./services/TrackingService";
import { Client } from "./types/Services/TrackingService";


//#region TEST AREA

// const SIGNATURE = "3iPFK2PZgaQpt6n7G9viYgqxswrZuyFUCLNXP7RqZD1MVxA4VnmK9qfwZdCALvgHftvtoBtKvzyxC9RQw78dh3Qo"
// const TOKEN_ADDRESS = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"

// fetchTransaction(SIGNATURE).then(x => {

//     const signature = SIGNATURE
//     const logs = x?.meta?.logMessages || []

//     logsCallback({ signature, logs, err: null }, new PublicKey(TOKEN_ADDRESS), new Listener(new PublicKey(TOKEN_ADDRESS)))

// })

//#endregion

// let startDate: Date | null = null
// setInterval(() => {
//     if(SIGNATURE_RECEIVED == 0) return
//     if(!startDate) startDate = new Date()
//     const currentDate = new Date()
//     const diff = currentDate.getTime() - startDate.getTime()
//     const seconds = diff / 1000
//     const avgSignatureReceived = SIGNATURE_RECEIVED / seconds
//     const avgSignatureFetched = SIGNATURE_FETCHED / seconds
//     const skipped = SIGNATURE_RECEIVED - SIGNATURE_FETCHED
//     const skippedPercentage = (skipped / SIGNATURE_RECEIVED) * 100
//     console.clear()
//     console.log(`Uptime: ${seconds} seconds`)
//     console.log(`Signatures Received: ${SIGNATURE_RECEIVED}`)
//     console.log(`Average Signatures Received: ${avgSignatureReceived} per second`)
//     console.log(`Signatures Fetched: ${SIGNATURE_FETCHED}`)
//     console.log(`Average Signatures Fetched: ${avgSignatureFetched} per second`)
//     console.log(`Rate Limited: ${RATE_LIMITED}`)
//     console.log(`Skipped %: ${skippedPercentage}%`)
//     console.log(`Number of Listeners: ${listeners.length}`)
    
// }, 1000)

dotenv.config();

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

    console.log(`${socket.id} connected.`)

    const client: Client = {
        socket: socket,
        subscriptions: [] as PublicKey[],
    } as Client

    socket.on("subscribe", (tokenAddress: string) => {

        let coinAddress: PublicKey
        try {
            coinAddress = new PublicKey(tokenAddress)
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

        console.log(`Creating listener for ${coinAddress.toString()}`)
        const listener = new Listener(coinAddress)  
        listener.addClient(client)
        listeners.push(listener)
        client.subscriptions.push(coinAddress)
        socket.emit("subscribed", coinAddress.toString())

    })

    socket.on("unsubscribe", (tokenAddress: String) => {

        let coinAddress: PublicKey

        try {
            coinAddress = new PublicKey(tokenAddress)
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

        const listenerClosed = listener.removeClient(client)
        client.subscriptions = client.subscriptions.filter(s => !s.equals(coinAddress))

        socket.emit("unsubscribed", coinAddress.toString())

        if (listenerClosed) {
            console.log(`Listener for ${coinAddress.toString()} closed.`)
            listeners.splice(listeners.indexOf(listener), 1)
        }

        

    })

    socket.on("disconnect", () => {
        console.log(`⚠️ ${socket.id} disconnected.`);
        for (let i = listeners.length - 1; i >= 0; i--) { 
            const listener = listeners[i];
            const listenerClosed = listener.removeClient(client);
            if (listenerClosed) {
                console.log(`Listener for ${listener.getTokenAddress().toString()} closed.`);
                listeners.splice(i, 1);
            }
        }
    });

})

httpServer.listen(3001, () => {
    console.log("Listening on port 3001")
})