import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
    console.log("✅ Connected to the server. Socket ID:", socket.id);

    subscribeToToken("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN")
    subscribeToToken("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN")
    subscribeToToken("6P8ixuqGZpfyHAxyxbU4a31vsMiFiCQjBzVV58gPpump")
    subscribeToToken("3VU97b7BhzhqCDvJmhZyghdbWUZqjkBvY236yuLCpump")
    subscribeToToken("83iBDw3ZpxqJ3pEzrbttr9fGA57tttehDAxoFyR1moon")
    subscribeToToken("5WBorwVpA1g8hEwRq32zd76U6qMBCPpqF8F6m5guvjVQ")
});

socket.on("error", (message) => {
    console.error("❌ Error:", message);
});

socket.on("trade", (trade) => {
    //console.log(trade)
})

function subscribeToToken(tokenAddress) {
    socket.emit("subscribe", tokenAddress);
}

function unsubscribeFromToken(tokenAddress) {
    socket.emit("unsubscribe", tokenAddress);
}

socket.on("subscribed", (tokenAddress) => {
    console.log(`✅ Subscribed successfully: ${tokenAddress}`);
});

socket.on("unsubscribed", (tokenAddress) => {
    console.log(`✅ Unsubscribed successfully: ${tokenAddress}`);
});

