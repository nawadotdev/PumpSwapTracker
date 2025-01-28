import { struct, u8 } from "@solana/buffer-layout";
import { bool, publicKey, u64 } from "@solana/buffer-layout-utils";
import { getTradeDataWithLogsParams, Program, TradeData, } from "../../types";
import { PumpFun, Solana } from "../../constants";

const swapDiscriminator = [189, 219, 127, 211, 78, 230, 97, 238]

const logLayout = struct<any>([
    u64("discriminator"),
    publicKey("mint"),
    u64("solAmount"),
    u64("tokenAmount"),
    bool("isBuy"),
    publicKey("user"),
    u64("timestamp"),
    u64("virtualSolReserves"),
    u64("virtualTokenReserves"),
    u64("realSolReserves"),
    u64("realTokenReserves"),
])

const logMatch = (log: string) => {

    try {
        if (!log.startsWith("Program data: vdt")) return false
        const logData = log.split("Program data: ")[1]
        const buffer = Buffer.from(logData, "base64")
        const discriminator = buffer.slice(0, 8)
        if (!swapDiscriminator.every((v, i) => v === discriminator[i])) return null
        return true
    } catch (_) {
        return false
    }

}

const getTradeData = (params: getTradeDataWithLogsParams) => {

    const { logs } = params

    for (let log of logs) {
        if (!logMatch(log)) continue
        const logData = log.split("Program data: ")[1]
        const data = logLayout.decode(Buffer.from(logData, "base64"))

        const solAmount = data.solAmount.toString()
        const tokenAmount = data.tokenAmount.toString()

        return {
            user : data.user,
            inputMint : data.isBuy ? Solana.TokenAddress : data.mint,
            outputMint : data.isBuy ? data.mint : Solana.TokenAddress,
            inputAmount : data.isBuy ? solAmount : tokenAmount,
            outputAmount : data.isBuy ? tokenAmount : solAmount,
            inputDecimals : data.isBuy ? 9 : 6,
            outputDecimals : data.isBuy ? 6 : 9
        } as TradeData
    }

}

export const PumpFunProgram = {
    programId : PumpFun.Program,
    getTradeData,
    logMatch,
    fetchRequired: false,
    tradeProgram: true,
} as Program