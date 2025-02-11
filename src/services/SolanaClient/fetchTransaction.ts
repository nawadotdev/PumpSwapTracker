import { Connection } from "../../services"

const MAX_TRY = 10
export let RATE_LIMITED = 0

export const fetchTransaction = async (signature : string) => {
    
    
    let tryCount = 0
    let tx = null
    while(tryCount < MAX_TRY){
        tryCount++
        try{
            tx = await Connection.getParsedTransaction(signature, { maxSupportedTransactionVersion : 0, commitment: "confirmed"})
            if(tx) break
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }catch(e){
            console.log(e)
            RATE_LIMITED++
        }
    }
    return tx

}