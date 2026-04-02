import { useState } from "react";
import { defaultProducts, InventoryTable, ProductCatalogItem, ProductBatch } from "../components/InventoryTable";
import { DispenseList, DispenseItem, DispenseReason } from "../components/DispenseList";
import { SearchBar } from "../components/SearchBar";

export function Dispense() {
  const [dispenseItems, setDispenseItems] = useState<DispenseItem[]>([]);

  const handleAddToDispense = (product: ProductCatalogItem, batch: ProductBatch) => {
    const exists = dispenseItems.find((item) => item.batchNumber === batch.batchNumber);
    if (exists) return;

    const newItem: DispenseItem = {
      productId: 0,
      name: product.productDetails,
      batchNumber: batch.batchNumber,
      quantity: 1,
      maxQuantity: batch.quantity,
      reason: "Sale",
    };
    setDispenseItems((prev) => [...prev, newItem]);
  };

  const handleUpdateQuantity = (batchNumber: string, newQuantity: number) => {
    setDispenseItems((items) =>
      items.map((item) => (item.batchNumber === batchNumber ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleUpdateReason = (batchNumber: string, reason: DispenseReason) => {
    setDispenseItems((items) =>
      items.map((item) => (item.batchNumber === batchNumber ? { ...item, reason } : item))
    );
  };

  const handleRemove = (batchNumber: string) => {
    setDispenseItems((items) => items.filter((item) => item.batchNumber !== batchNumber));
  };

  const handleConfirmDispense = () => {
    if (dispenseItems.length === 0) return;
    alert(`Confirmed dispensing ${dispenseItems.length} items.`);
    setDispenseItems([]);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col p-6">
      
      {/* 1. Header Removed: Floating Search Section */}
      <div className="w-full max-w-2xl mx-auto mb-6 shrink-0">
        <SearchBar 
          placeholder="Search by medicine name, SKU, or batch..." 
          onSearch={(q) => console.log("Searching for:", q)} 
        />
      </div>

      {/* 2. Main Content Area: Proportional and centered */}
      <main className="max-w-400 mx-auto w-full flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Inventory Section (Left) */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 rounded-3xl overflow-hidden border border-slate-200/50 bg-white shadow-sm">
            <InventoryTable 
              products={defaultProducts} 
              mode="dispense"
              onAddBatch={handleAddToDispense} 
            />
          </div>
        </section>

        {/* Action Sidebar (Right) */}
        <aside className="w-full lg:w-96 flex flex-col min-h-0 shrink-0">
          <div className="flex-1 min-h-0">
            <DispenseList
              items={dispenseItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateReason={handleUpdateReason}
              onRemove={handleRemove}
              onConfirm={handleConfirmDispense}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}