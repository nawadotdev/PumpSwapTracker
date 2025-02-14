import { PublicKey } from "@solana/web3.js";

// Clear console.logs for production

// Interfaces for API responses
interface PumpFunResponse {
  total_supply: number;
  market_cap: number;
}

interface DexscreenerPair {
  priceUsd: string;
  volume: {
    h24: number;
    [key: string]: any;
  };
}

interface DexscreenerResponse {
  schemaVersion: string;
  pairs: DexscreenerPair[] | null;
}

interface JupiterResponse {
  data: {
    [key: string]: {
      id: string;
      type: string;
      price: string;
    };
  };
}

// Fetch token details from Jupiter API
const fetchFromJupiter = async (tokenAddress: string): Promise<number | null> => {
  const url = `https://api.jup.ag/price/v2?ids=${tokenAddress}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`Jupiter API HTTP error: ${resp.status}`);
      return null;
    }
    const data: JupiterResponse = await resp.json();

    if (!data.data || !data.data[tokenAddress] || !data.data[tokenAddress].price) {
      console.error("Invalid data from Jupiter API:", data);
      return null;
    }

    const price = Number(data.data[tokenAddress].price);
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error("Error fetching from Jupiter API:", (error as Error).message);
    return null;
  }
};



// Fetch token details from PumpFun API
const fetchFromPumpFun = async (tokenAddress: string): Promise<number | null> => {
  const url = `https://frontend-api-v2.pump.fun/coins/${tokenAddress}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`PumpFun API HTTP error: ${resp.status}`);
      return null;
    }
    const data: PumpFunResponse = await resp.json();

    if (data.total_supply == null || data.market_cap == null) {
      console.error("Invalid data from PumpFun API:", data);
      return null;
    }

    const supply = data.total_supply / Math.pow(10, 6);
    if (supply === 0) {
      console.error("Total supply is zero, price cannot be calculated.");
      return null;
    }
    const price = data.market_cap / supply;
    return price;
  } catch (error) {
    console.error("Error fetching from PumpFun API:", (error as Error).message);
    return null;
  }
};

// Fetch token details from Dexscreener API
const fetchFromDexscreener = async (tokenAddress: string): Promise<number | null> => {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`Dexscreener API HTTP error: ${resp.status}`);
      return null;
    }
    const data: DexscreenerResponse = await resp.json();

    if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
      console.error("Invalid or empty pairs field from Dexscreener API:", data);
      return null;
    }

    const validPairs = data.pairs.filter(pair => pair.volume && pair.volume.h24 != null);
    if (validPairs.length === 0) {
      console.error("No valid pair with volume data found:", data);
      return null;
    }

    const highestVolumePair = validPairs.sort((a, b) => b.volume.h24 - a.volume.h24)[0];

    if (!highestVolumePair.priceUsd) {
      console.error("Selected pair has no priceUsd:", highestVolumePair);
      return null;
    }

    const price = Number(highestVolumePair.priceUsd);
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error("Error fetching from Dexscreener API:", (error as Error).message);
    return null;
  }
};

const providers = [fetchFromPumpFun, fetchFromJupiter, fetchFromDexscreener];
export const fetchTokenDetails = async (
  tokenAddress: string | PublicKey
): Promise<number | null> => {
  const tokenAddressStr = tokenAddress.toString();

  for (const provider of providers) {
    const price = await provider(tokenAddressStr);
    if (price != null) return price;
  }

  console.error("All providers failed to fetch token details for:", tokenAddressStr);
  return null;
};
