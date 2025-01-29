import { Solana } from "../../constants"
import { getTradeDataWithLogsParams, getTradeDataWithTransactionParams, TradeData } from "../../types"
import { JupiterProgram } from "./Jupiter"
import { PumpFunProgram } from "./PumpFun"
import { RaydiumAmmProgram } from "./RaydiumAmm"
import { RaydiumClmmProgram } from "./RaydiumClmm"
import { RaydiumCpmmProgram } from "./RaydiumCpmm"

export const Programs = [
    RaydiumAmmProgram,
    PumpFunProgram,
    RaydiumCpmmProgram,
    RaydiumClmmProgram,
    JupiterProgram
]

const knownNonTradeProgram = {
    fetchRequired: false,
    tradeProgram: false,
    logMatch : (log: string) => false,
    getTradeData : (params: (getTradeDataWithLogsParams | getTradeDataWithTransactionParams)) => ({} as TradeData | null)
}

const programIdMap = {
    [Solana.TokenProgram.toString()]: {
        ...knownNonTradeProgram,
        programId : Solana.TokenProgram
    },
    [Solana.SystemProgram.toString()]: {
        ...knownNonTradeProgram,
        programId : Solana.SystemProgram
    },
    [Solana.ComputeBudgetProgram.toString()] : {
        ...knownNonTradeProgram,
        programId : Solana.ComputeBudgetProgram
    },
    [Solana.ATokenProgram.toString()] : {
        ...knownNonTradeProgram,
        programId : Solana.ATokenProgram
    },
    [Solana.MemoProgram.toString()] : {
        ...knownNonTradeProgram,
        programId : Solana.MemoProgram
    }
}

for (let program of Programs) {
    programIdMap[program.programId.toString()] = program
}

export { programIdMap }