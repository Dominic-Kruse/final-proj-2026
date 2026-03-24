import { InventoryTable } from "../components/InventoryTable";

export function Inventory() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
        
        {/* Action Buttons Container */}
        <div className="flex items-center gap-3">
          {/* Secondary Button */}
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
            Export CSV
          </button>
          <button className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2">
            Edit Stocks
          </button>
          {/* Primary Button */}
          <button className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2">
            <span>+</span> Add Product
          </button>
        </div>
      </div>
      
      <InventoryTable />
    </>
  );
}