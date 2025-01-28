import { Connection as Con } from "@solana/web3.js";
import { HELIUS_API_URL } from "../../constants";
export const Connection = new Con(HELIUS_API_URL);
