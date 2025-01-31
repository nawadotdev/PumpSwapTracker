import { PublicKey } from "@solana/web3.js";
import { Client } from "../../types/Services/TrackingService";
import { subscribeLogs, unsubscribeLogs } from "../SolanaClient";
import { logsCallback } from "../../utils/TransactionLogs/logsCallback";
import { TradeData } from "../../types";

export class Listener {


    private clients: Client[] = []
    private readonly listenerId : number
    private readonly tokenAddress : PublicKey

    constructor(tokenAddress: PublicKey){
        this.listenerId = subscribeLogs({
            filter: tokenAddress,
            callback : (logs) => logsCallback(logs, tokenAddress, this)
        })
        this.tokenAddress = tokenAddress
    }

    unsubscribe = () => {
        unsubscribeLogs(this.listenerId)
        return true
    }

    addClient = (client:Client) => {
        const existingClient = this.clients.find(c => c.socket === client.socket)
        if(existingClient) return false
        this.clients.push(client)
        return true
    }

    removeClient = (client:Client) => {
        this.clients = this.clients.filter(c => c.socket !== client.socket)
        if(this.clients.length === 0){
            this.unsubscribe()
            return true
        }
        return false
    }

    getClients = () => {
        return this.clients
    }

    getListenerId = () => {
        return this.listenerId
    }

    getTokenAddress = () => {
        return this.tokenAddress
    }

    emit = (trades: (TradeData | null)[]) => {
        this.clients.forEach(client => {
            client.socket.emit("trade", trades)
        })
    }

}