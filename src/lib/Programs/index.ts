import { Solana } from "../../constants"
import { PumpFunProgram } from "./PumpFun"
import { RaydiumAmmProgram } from "./RaydiumAmm"

export const Programs = [
    RaydiumAmmProgram,
    PumpFunProgram
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