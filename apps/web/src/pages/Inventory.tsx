import { InventoryTable } from "../components/InventoryTable";

export function Inventory() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Inventory</h1>
      </div>
      <InventoryTable />
    </>
  );
}