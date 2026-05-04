// --- 1. Define the Interfaces ---

// The event payload
interface StockEvent {
  productId: number;
  batchId?: number;
  currentQuantity: number;
  reorderLevel: number;
  productName: string;
}

interface ExpiryEvent {
  batchId: number;
  productId: number;
  productName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}

function daysUntilExpiry(expiryDate: string | Date): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
}

// The Observer interface
interface Observer {
  updateOnLowStock?(event: StockEvent): void;
  updateOnExpiry?(event: ExpiryEvent): void;
}

// --- 2. Create the Subject (The Event Hub) ---

class InventoryEventHub {
  private observers: Observer[] = [];

  subscribe(observer: Observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer: Observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notifyLowStock(event: StockEvent) {
    for (const observer of this.observers) {
      if (observer.updateOnLowStock) observer.updateOnLowStock(event);
    }
  }

  notifyExpiry(event: ExpiryEvent) {
    for (const observer of this.observers) {
      if (observer.updateOnExpiry) observer.updateOnExpiry(event);
    }
  }
}

// --- 3. Create Concrete Observers ---

class DashboardAlerter implements Observer {
  updateOnLowStock(event: StockEvent) {
    console.log(
      `[DASHBOARD ALERT] Low Stock for ${event.productName}! Only ${event.currentQuantity} left (Reorder at: ${event.reorderLevel})`,
    );
    // Broadcast to frontend via WebSocket
    try {
      // Dynamic import to avoid circular dependency
      import("../index.js").then(({ broadcastNotification }) => {
        broadcastNotification({
          type: "LOW_STOCK",
          title: "Low Stock Alert",
          message: `${event.productName} is running low! Only ${event.currentQuantity} units left.`,
          productId: event.productId,
          productName: event.productName,
          currentQuantity: event.currentQuantity,
          reorderLevel: event.reorderLevel,
          timestamp: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.error("Failed to broadcast low stock notification:", error);
    }
  }

  updateOnExpiry(event: ExpiryEvent) {
    console.warn(
      `[DASHBOARD WARNING] Batch ${event.batchId} of ${event.productName} expires in ${event.daysUntilExpiry} days!`,
    );
    // Broadcast to frontend via WebSocket
    try {
      import("../index.js").then(({ broadcastNotification }) => {
        broadcastNotification({
          type: "EXPIRY_WARNING",
          title: "Expiry Alert",
          message: `${event.productName} batch #${event.batchId} expires in ${event.daysUntilExpiry} days.`,
          productId: event.productId,
          productName: event.productName,
          batchId: event.batchId,
          daysUntilExpiry: event.daysUntilExpiry,
          timestamp: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.error("Failed to broadcast expiry notification:", error);
    }
  }
}

class EmailNotifier implements Observer {
  updateOnLowStock(event: StockEvent) {
    // Logic to send email to the purchasing manager
    console.log(
      `[EMAIL] Sending reorder request to purchasing for ${event.productName}...`,
    );
  }
}

// --- 4. Wire it all together ---

export const inventoryHub = new InventoryEventHub();

// Register your observers (usually done once at application startup)
// Node.js module system ensures this runs once per process
inventoryHub.subscribe(new DashboardAlerter());
inventoryHub.subscribe(new EmailNotifier());

// --- Example Usage ---
// You would call this inside your service logic after a stock transaction
export function checkStockLevels(
  productId: number,
  totalQuantity: number,
  reorderLevel: number,
  productName: string,
) {
  if (totalQuantity <= reorderLevel) {
    inventoryHub.notifyLowStock({
      productId,
      currentQuantity: totalQuantity,
      reorderLevel,
      productName,
    });
  }
}

export function checkExpiryWarnings(
  productId: number,
  batchId: number,
  expiryDate: string | Date,
  productName: string,
  nearExpiryDays = 90,
) {
  const daysLeft = daysUntilExpiry(expiryDate);

  if (daysLeft <= nearExpiryDays) {
    inventoryHub.notifyExpiry({
      productId,
      batchId,
      productName,
      expiryDate: new Date(expiryDate),
      daysUntilExpiry: daysLeft,
    });
  }
}
