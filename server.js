const WebSocket = require("ws");
const http = require("http");

// Sample order data
const orderData = [
  {
    AppOrderID: 1111075075,
    price: 2,
    triggerPrice: 4,
    priceType: "MKT",
    productType: "I",
    status: "complete",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "IDEA",
  },
  {
    AppOrderID: 1111075075,
    price: 2,
    triggerPrice: 4,
    priceType: "MKT",
    productType: "I",
    status: "complete",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "IDEA",
  },
  {
    AppOrderID: 1111075075,
    price: 2,
    triggerPrice: 4,
    priceType: "MKT",
    productType: "I",
    status: "complete",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "IDEA",
  },
  {
    AppOrderID: 1111075076,
    price: 3,
    triggerPrice: 5,
    priceType: "MKT",
    productType: "I",
    status: "complete",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "RELIANCE",
  },
  {
    AppOrderID: 1111075076,
    price: 3,
    triggerPrice: 5,
    priceType: "MKT",
    productType: "I",
    status: "complete",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "RELIANCE",
  },
  {
    AppOrderID: 1111075077,
    price: 4,
    triggerPrice: 6,
    priceType: "LMT",
    productType: "I",
    status: "open",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "TATA",
  },
  {
    AppOrderID: 1111075078,
    price: 5,
    triggerPrice: 7,
    priceType: "LMT",
    productType: "I",
    status: "cancelled",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "sell",
    AlgoID: "",
    exchange: "NSE",
    symbol: "BAJAJ",
  },
  {
    AppOrderID: 1111075079,
    price: 6,
    triggerPrice: 8,
    priceType: "MKT",
    productType: "I",
    status: "complete",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "WIPRO",
  },
  {
    AppOrderID: 1111075079,
    price: 6,
    triggerPrice: 8,
    priceType: "MKT",
    productType: "I",
    status: "complete",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "WIPRO",
  },
  {
    AppOrderID: 1111075080,
    price: 7,
    triggerPrice: 9,
    priceType: "LMT",
    productType: "I",
    status: "open",
    CumulativeQuantity: 0,
    LeavesQuantity: 1,
    transaction: "buy",
    AlgoID: "",
    exchange: "NSE",
    symbol: "ONGC",
  },
];

// Function to get current date and time in the specified format
function getCurrentDateTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

// Create a WebSocket server by passing the HTTP server
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("Client connected");

  let orderIndex = 0;

  // Function to send updates
  const sendUpdates = (count, delay) => {
    setTimeout(() => {
      for (let i = 0; i < count && orderIndex < orderData.length; i++) {
        const order = { ...orderData[orderIndex++] };
        order.OrderGeneratedDateTimeAPI = getCurrentDateTime();
        ws.send(JSON.stringify(order));
        console.log(
          `Sent order update: ${JSON.stringify(
            order
          )} at ${new Date().toISOString()}`
        );
      }
      if (orderIndex >= orderData.length) {
        ws.close();
        console.log("All updates sent, closing connection");
      }
    }, delay);
  };

  // Schedule the updates
  sendUpdates(10, 1000);
  sendUpdates(20, 3000);
  sendUpdates(40, 6000);
  sendUpdates(30, 11000);

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = 8085;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on http://localhost:${PORT}`);
});
