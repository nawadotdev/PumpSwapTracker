import { PublicKey } from "@solana/web3.js";
import { Client } from "../../types/Services/TrackingService";
import { subscribeLogs, unsubscribeLogs } from "../SolanaClient";
import { logsCallback } from "../../utils/TransactionLogs/logsCallback";
import { TradeData } from "../../types";

export class Listener {
  private clients: Set<Client> = new Set();
  private readonly listenerId: number;
  private readonly tokenAddress: PublicKey;

  constructor(tokenAddress: PublicKey) {
    this.tokenAddress = tokenAddress;
    this.listenerId = subscribeLogs({
      filter: tokenAddress,
      callback: (logs) => logsCallback(logs, tokenAddress, this),
    });
  }

  private unsubscribe(): void {
    unsubscribeLogs(this.listenerId);
  }

  addClient(client: Client): boolean {
    if (this.clients.has(client)) return false;
    this.clients.add(client);
    return true;
  }

  removeClient(client: Client): boolean {
    if (!this.clients.has(client)) return false;
    this.clients.delete(client);

    if (this.clients.size === 0) {
      this.unsubscribe();
      return true;
    }
    return false;
  }

  getClients(): Client[] {
    return Array.from(this.clients);
  }

  emit(trades: (TradeData | null)[], signature: string | null): void {
    this.clients.forEach((client) => {
      client.socket.emit("trade", { trades, signature });
    });
  }
}
