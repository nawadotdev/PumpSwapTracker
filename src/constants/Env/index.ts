import dotenv from 'dotenv';

dotenv.config();

export const HELIUS_API_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;