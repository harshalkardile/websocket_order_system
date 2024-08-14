const WebSocket = require("ws");

class OrderHandler {
  constructor() {
    this.orders = {};
    this.filteredUpdates = new Map();
    this.actionsTaken = [];
    this.logEntries = [];
  }

  // Checks if an order is redundant based on previously filtered updates.
  isRedundant(order) {
    const orderKey = `${order.AppOrderID}-${order.price}-${order.triggerPrice}-${order.priceType}-${order.productType}-${order.status}-${order.exchange}-${order.symbol}`;
    return this.filteredUpdates.has(orderKey);
  }

  // Adds an order to filteredUpdates Map
  addOrderToFilteredUpdates(order) {
    const orderKey = `${order.AppOrderID}-${order.price}-${order.triggerPrice}-${order.priceType}-${order.productType}-${order.status}-${order.exchange}-${order.symbol}`;
    this.filteredUpdates.set(orderKey, order);
  }

  // Determines the action to be taken based on the order's priceType and status.
  determineAction(order) {
    const existingOrder = this.orders[order.AppOrderID];
    let action;

    // Determine actions based on the existence of the order
    if (!existingOrder) {
      switch (order.priceType) {
        case "MKT":
          action = order.status === "complete" ? "placeOrder" : null;
          break;
        case "LMT":
          action = order.status === "open" ? "placeOrder" : null;
          break;
        case "SL-LMT":
        case "SL-MKT":
          action = order.status === "pending" ? "placeOrder" : null;
          break;
        default:
          action = null; 
      }
    } else {
      switch (order.priceType) {
        case "MKT":
          action = order.status === "complete" ? "modifyOrder" : null;
          break;
        case "LMT":
          action = order.status === "open" ? "modifyOrder" : null;
          break;
        case "SL-LMT":
        case "SL-MKT":
          action = order.status === "pending" ? "modifyOrder" : null;
          break;
        default:
          action = null; 
      }
    }

    // Special case for cancelling orders regardless of existence
    if (
      ["LMT", "SL-LMT", "SL-MKT"].includes(order.priceType) &&
      order.status === "cancelled"
    ) {
      action = "cancelOrder";
    }

    return action;
  }

  // Handles incoming orders: filters redundant ones, determines the action, and logs the necessary information.
  handleOrder(order) {
    if (!this.isRedundant(order)) {
      this.addOrderToFilteredUpdates(order); // Correctly add order to filteredUpdates Map

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
      `Filtered Updates: ${this.filteredUpdates.size} unique and non-redundant updates.`
    );

    // Convert Map to an array of [key, value] pairs and then stringify
    const filteredUpdatesArray = Array.from(this.filteredUpdates.entries()).map(
      ([key, value]) => ({ key, value })
    );
    console.log(JSON.stringify(filteredUpdatesArray, null, 2));

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
