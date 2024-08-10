const WebSocket = require("ws");

class OrderHandler {
  constructor() {
    this.orders = {};
    this.filteredUpdates = [];
    this.actionsTaken = [];
    this.logEntries = [];
  }

  // Checks if an order is redundant based on previously filtered updates.
  isRedundant(order) {
    return this.filteredUpdates.some(
      (existingOrder) =>
        existingOrder.AppOrderID === order.AppOrderID &&
        existingOrder.price === order.price &&
        existingOrder.triggerPrice === order.triggerPrice &&
        existingOrder.priceType === order.priceType &&
        existingOrder.productType === order.productType &&
        existingOrder.status === order.status &&
        existingOrder.exchange === order.exchange &&
        existingOrder.symbol === order.symbol
    );
  }

  // Determines the action to be taken based on the order's priceType and status.
    determineAction(order) {
      
        const existingOrder = this.orders[order.AppOrderID];
        let action;
        if (!existingOrder) {
            if (order.priceType === "MKT" && order.status === "complete") {
                return "placeOrder";
            } else if (order.priceType === "LMT" && order.status === "open") {
                return "placeOrder";
            } else if (
                (order.priceType === "SL-LMT" || order.priceType === "SL-MKT") &&
                order.status === "pending"
            ) {
                return "placeOrder";
            } else if (
                ["LMT", "SL-LMT", "SL-MKT"].includes(order.priceType) &&
                order.status === "cancelled"
            ) {
                return "cancelOrder";
            }
        } else {
            if (["MKT", "LMT", "SL-LMT", "SL-MKT"].includes(order.priceType)) {
              return "modifyOrder";
            }
        }
    return null; 
  }

  // Handles incoming orders: filters redundant ones, determines the action, and logs the necessary information.
  handleOrder(order) {
    if (!this.isRedundant(order)) {
      this.filteredUpdates.push(order);
      const action = this.determineAction(order);
      if (action) {
        this.actionsTaken.push(
          `For AppOrderID: ${order.AppOrderID} : ${action}`
        );
        this.logEntry(order);

        this.orders[order.AppOrderID] = order;
      }
    }
  }

  // Logs an entry for each order with additional metadata like timestamp and clientID.
  logEntry(order) {
    const clientID = 95055780 + (order.AppOrderID % 2);
    let timestamp;
    try {
      const date = new Date(order.OrderGeneratedDateTimeAPI.replace(" ", "T"));
      if (isNaN(date.getTime())) {
        timestamp = new Date().toISOString();
      } else {
        timestamp = date.toISOString();
      }
    } catch (error) {
      timestamp = new Date().toISOString();
    }
    const logEntry = {
      timestamp,
      clientID: clientID.toString(),
      ...order, 
    };
    this.logEntries.push(logEntry); 
  }

  // Prints out the filtered updates, actions taken, and example log entries for the orders.
  printResults() {
    console.log(
      `Filtered Updates: ${this.filteredUpdates.length} unique and non-redundant updates.`
    );
    console.log(JSON.stringify(this.filteredUpdates, null, 2)); 

    console.log("\nActions Taken:");
    this.actionsTaken.forEach((action) => console.log(action)); 

    console.log("\nExample Log Entries for Updater:");
    this.logEntries.forEach((entry) => {
      console.log(
        `Update sent to order book at ${entry.timestamp} for ClientID ${
          entry.clientID
        }: ${JSON.stringify(entry)}`
      );
    });
  }
}

const orderHandler = new OrderHandler();

const ws = new WebSocket("ws://localhost:8085");

ws.on("open", function open() {
  console.log(
    "=>>>>>>>>>>>>Connected to WebSocket server====================="
  );
});

ws.on("message", function incoming(data) {
  const order = JSON.parse(data);
  orderHandler.handleOrder(order);
});

ws.on("close", function close() {
  console.log("Disconnected from WebSocket server");
  orderHandler.printResults();
});

ws.on("error", function error(err) {
  console.error("WebSocket error:", err);
});
