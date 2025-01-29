import { ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js"
import { getTradeDataWithTransactionParams, Program as ProgramType, TradeData } from "../../types"
import { Jupiter as JupConstants, Solana } from "../../constants"
import { Program, Event, Provider, utils } from "@coral-xyz/anchor"
import { IDL, Jupiter } from "../Idl";

const program = new Program<Jupiter>(
    IDL,
    JupConstants.AggregatorV6Program.toString(),
    {} as Provider
  );


const logMatch = (log: string) => {

    try {
        if (!log.startsWith("Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 ")) return false
        return true
    } catch (_) {
        return false
    }

}

const getTradeData = (params: getTradeDataWithTransactionParams) => {

    const { transaction, instruction, index, outerIndex } = params

    const isInnerInstruction = outerIndex !== null

    const user = (instruction as PartiallyDecodedInstruction).accounts[1]

    var innerInstructions : (ParsedInstruction | PartiallyDecodedInstruction)[]

    if(!isInnerInstruction){

        innerInstructions = transaction.meta?.innerInstructions?.find(ix => ix.index == index)?.instructions || []

    }else{
        const outersInstructions = transaction.meta?.innerInstructions?.find(ix => ix.index == outerIndex)?.instructions || []
        let current = []
        for(let i = index+1; i<outersInstructions.length; i++){
            const ix = outersInstructions[i]
            if(ix.programId.equals(JupConstants.AggregatorV6Program) && (ix as PartiallyDecodedInstruction).accounts[1].equals(JupConstants.ProgramAuthority) && (ix as PartiallyDecodedInstruction).accounts[0].equals(Solana.TokenProgram)) break
            if(ix.programId.equals(JupConstants.AggregatorV6Program)){
                current.push(ix)
            }
        }
        innerInstructions = current
    }

    const events = getEvents(program, innerInstructions)

    if(events.length == 0) return null

    const inputMint = events[0].data.inputMint
    const inputMintAmount = (events[0].data.inputAmount as BigInt).toString()
    const inputMintDecimals = transaction.meta?.postTokenBalances?.find(bal => bal.mint == (inputMint as PublicKey).toString())?.uiTokenAmount?.decimals

    const outputMint = events[events.length-1].data.outputMint
    const outputMintAmount = (events[events.length-1].data.outputAmount as BigInt).toString()
    const outputMintDecimals = transaction.meta?.postTokenBalances?.find(bal => bal.mint == (outputMint as PublicKey).toString())?.uiTokenAmount?.decimals


    return {
        user,
        inputMint,
        outputMint,
        inputAmount: inputMintAmount,
        outputAmount: outputMintAmount,
        inputDecimals: inputMintDecimals,
        outputDecimals: outputMintDecimals
    } as TradeData
}

export const JupiterProgram = {
    programId: JupConstants.AggregatorV6Program,
    logMatch,
    getTradeData,
    fetchRequired: true,
    tradeProgram: true
} as ProgramType

const getEvents = (
    program: any,
    innerInstructions: (PartiallyDecodedInstruction | ParsedInstruction)[]
  ) => {
    let events: Event[] = [];
  
    innerInstructions.map(async ix => {
        if (!ix.programId.equals(JupConstants.AggregatorV6Program)) return;
        if (!("data" in ix)) return;
    
        const ixData = utils.bytes.bs58.decode(ix.data);
        const eventData = utils.bytes.base64.encode(ixData.subarray(8));
        const event = program.coder.events.decode(eventData);
        if (!event || event?.name != "SwapEvent") return;
    
        events.push(event);
    })

  
    return events;
  }