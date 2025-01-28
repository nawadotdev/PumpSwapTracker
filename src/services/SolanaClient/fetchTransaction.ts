import { Connection } from "../../services"

const MAX_TRY = 10

export const fetchTransaction = async (signature : string) => {

    var _try = 0
    var tx = null
    while(_try++ < MAX_TRY && !tx){
        try{
            tx = await Connection.getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion : 0})
        }catch(_){
        }
    }

    return {
        tx,
        blockchainTry : _try
    }

}