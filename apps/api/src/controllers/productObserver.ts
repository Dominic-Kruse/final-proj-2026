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
    this.observers = this.observers.filter(obs => obs !== observer);
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
    console.log(`[DASHBOARD ALERT] Low Stock for ${event.productName}! Only ${event.currentQuantity} left (Reorder at: ${event.reorderLevel})`);
    // Logic to push notification to front-end (e.g., via WebSockets/Socket.io)
  }

  updateOnExpiry(event: ExpiryEvent) {
    console.warn(`[DASHBOARD WARNING] Batch ${event.batchId} of ${event.productName} expires in ${event.daysUntilExpiry} days!`);
  }
}

class EmailNotifier implements Observer {
  updateOnLowStock(event: StockEvent) {
    // Logic to send email to the purchasing manager
    console.log(`[EMAIL] Sending reorder request to purchasing for ${event.productName}...`);
  }
}

// --- 4. Wire it all together ---

export const inventoryHub = new InventoryEventHub();

// Register your observers (usually done once at application startup)
inventoryHub.subscribe(new DashboardAlerter());
inventoryHub.subscribe(new EmailNotifier());

// --- Example Usage ---
// You would call this inside your service logic after a stock transaction
export function checkStockLevels(productId: number, totalQuantity: number, reorderLevel: number, productName: string) {
  if (totalQuantity <= reorderLevel) {
    inventoryHub.notifyLowStock({
      productId,
      currentQuantity: totalQuantity,
      reorderLevel,
      productName
    });
  }
}