import type { ProductCatalogItem } from "../components/InventoryTable";
import type { MedicineWithStock } from "./types";

export function transformInventory(rows: MedicineWithStock[]): ProductCatalogItem[] {
    return rows.map((medicine) => {
        const batches = medicine.batches ?? [];
        const availableBatches = batches.filter(b => b.status === "available");

        return {
            productId: medicine.id,
            productDetails: medicine.name,
            dosage: medicine.genericName,
            form: medicine.form ?? null,
            baseUnit: medicine.baseUnit,
            packageUnit: medicine.packageUnit ?? null,
            conversionFactor: medicine.conversionFactor,
            category: medicine.category ?? "Uncategorized",
            totalStock: medicine.totalStock ?? 0,
            shelfLocation: availableBatches[0]?.inventoryLocation ?? "—",
            status:
                (medicine.totalStock ?? 0) === 0 ? "Out of Stock"
                : (medicine.totalStock ?? 0) <= medicine.reorderLevel ? "Low Stock"
                : "In Stock",
            batches: availableBatches.map(batch => ({
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                quantity: batch.currentQuantity,
                supplier: batch.supplierName ?? "Unknown",
                location: batch.inventoryLocation,
                costPrice: parseFloat(batch.costPrice),
                sellingPrice: parseFloat(batch.sellingPrice),
            })),
        };
    });
}