import { Solana } from "../../constants"
import { PumpFunProgram } from "./PumpFun"
import { RaydiumAmmProgram } from "./RaydiumAmm"
import { RaydiumCpmmProgram } from "./RaydiumCpmm"

export const Programs = [
    RaydiumAmmProgram,
    PumpFunProgram,
    RaydiumCpmmProgram
]

const programIdMap = {
    [Solana.TokenProgram.toString()]: {
        fetchRequired: false,
        tradeProgram: false,
    },
    [Solana.SystemProgram.toString()]: {
        fetchReqireed: false,
        tradeProgram: false,
    }
}

for (let program of Programs) {
    programIdMap[program.programId.toString()] = program
}

export { programIdMap }