import { Connection } from "../../services";

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1000;

export let RATE_LIMITED = 0;

export const fetchTransaction = async (signature: string) => {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      const tx = await Connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (tx) {
        return tx; // Return early if transaction is found
      }

      await delay(RETRY_DELAY_MS);
    } catch (error) {
      console.error("Transaction fetch error:", error);
      RATE_LIMITED++;
    }
    attempts++;
  }
  return null; // Explicitly return null if transaction is not found
};

// Utility function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
