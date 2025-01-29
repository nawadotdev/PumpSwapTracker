import { Connection } from "../../services"

const MAX_TRY = 10

export const fetchTransaction = async (signature : string) => {
    return Connection.getParsedTransaction(signature, { maxSupportedTransactionVersion : 0, commitment : "confirmed"})

}