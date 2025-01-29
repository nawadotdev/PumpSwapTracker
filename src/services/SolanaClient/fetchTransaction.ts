import { Connection } from "../../services"

const MAX_TRY = 10

export const fetchTransaction = async (signature : string) => {
    
    
    var tryCount = 0
    var tx = null
    while(tryCount < MAX_TRY){
        try{
            tx = await Connection.getParsedTransaction(signature, { maxSupportedTransactionVersion : 0, commitment: "confirmed"})
            if(tx) break
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }catch(e){
            tryCount++
        }
    }

    return tx

}