import { PublicKey } from "@solana/web3.js"
import { Socket } from "socket.io"

export type Client = {
    socket : Socket,
    subscriptions : PublicKey[]
}