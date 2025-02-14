import { PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { RATE_LIMITED } from "./services";
import {
  SIGNATURE_FETCHED,
  SIGNATURE_RECEIVED,
} from "./utils/TransactionLogs/logsCallback";
import { Server } from "socket.io";
import http from "http";
import { Listener } from "./services/TrackingService";
import { Client } from "./types/Services/TrackingService";

dotenv.config();

// --- Metrics Logging ---
const logMetrics = false
let startDate: Date | null = null;
setInterval(() => {
  if (!logMetrics) return;
  if (SIGNATURE_RECEIVED === 0) {
    return;
  }
  if (!startDate) {
    startDate = new Date();
  }
  const seconds = (Date.now() - startDate.getTime()) / 1000;
  const avgReceived = SIGNATURE_RECEIVED / seconds;
  const avgFetched = SIGNATURE_FETCHED / seconds;
  const skipped = SIGNATURE_RECEIVED - SIGNATURE_FETCHED;
  const skippedPct = (skipped / SIGNATURE_RECEIVED) * 100;
  console.clear();
  console.log(`Uptime: ${seconds} s`);
  console.log(`Received: ${SIGNATURE_RECEIVED} (${avgReceived.toFixed(2)}/s)`);
  console.log(`Fetched: ${SIGNATURE_FETCHED} (${avgFetched.toFixed(2)}/s)`);
  console.log(`Rate Limited: ${RATE_LIMITED}`);
  console.log(`Skipped: ${skippedPct.toFixed(2)}%`);
  console.log(`Listeners: ${listeners.size}`);
}, 1000);

// --- Listener Management ---
const listeners = new Map<string, Listener>();

// --- Utility ---
const createPublicKey = (address: string): PublicKey | null => {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
};

// --- Socket Server Setup ---
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`${socket.id} connected.`);
  const client: Client = { socket, subscriptions: [] };

  socket.on("subscribe", (tokenAddress: string) => {
    const pk = createPublicKey(tokenAddress);
    if (!pk) {
      return socket.emit("error", "Invalid token address");
    }

    if (client.subscriptions.includes(pk)) {
      return socket.emit("error", "Already subscribed");
    }
    const keyStr = pk.toString();
    let listener = listeners.get(keyStr);
    if (!listener) {
      console.log(`Creating listener for ${keyStr}`);
      listener = new Listener(pk);
      listeners.set(keyStr, listener);
    }
    listener.addClient(client);
    client.subscriptions.push(pk);
    socket.emit("subscribed", keyStr);
  });

  socket.on("unsubscribe", (tokenAddress: string) => {
    const pk = createPublicKey(tokenAddress);
    if (!pk) {
      return socket.emit("error", "Invalid token address");
    }

    const keyStr = pk.toString();
    if (!client.subscriptions.includes(pk)) {
      return socket.emit("error", "Not subscribed");
    }

    const listener = listeners.get(keyStr);
    if (!listener) {
      return socket.emit("error", "Listener not found");
    }

    if (listener.removeClient(client)) {
      console.log(`Listener for ${keyStr} closed.`);
      listeners.delete(keyStr);
    }
    client.subscriptions = client.subscriptions.filter(
      (s: PublicKey) => s !== pk
    );
    socket.emit("unsubscribed", keyStr);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected.`);
    client.subscriptions.forEach((keyStr) => {
      const key = new PublicKey(keyStr);
      const listener = listeners.get(key.toString());
      if (listener && listener.removeClient(client)) {
        console.log(`Listener for ${keyStr} closed.`);
        listeners.delete(key.toString());
      }
    });
  });
});

httpServer.listen(3001, () => {
  console.log("Listening on port 3001");
});
