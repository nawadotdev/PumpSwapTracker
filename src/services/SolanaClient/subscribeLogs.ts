import { SubscribeLogsParams } from "../../types";
import { Connection } from "./Connection";

export const subscribeLogs = (params : SubscribeLogsParams) => {
    return Connection.onLogs(params.filter, params.callback, params.commitment)
}

export const unsubscribeLogs = (subscriptionId : number) => {
    Connection.removeOnLogsListener(subscriptionId)
    return true
}