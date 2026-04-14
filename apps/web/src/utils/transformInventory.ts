import type { ProductCatalogItem } from "../components/InventoryTable";
import type { MedicineWithStock } from "./types";

function splitGenericAndDosage(value: string): { genericName: string; dosage: string | null } {
    const raw = value.trim();
    const firstDigitIndex = raw.search(/\d/);

    if (firstDigitIndex <= 0) {
        return { genericName: raw, dosage: null };
    }

    return {
        genericName: raw.slice(0, firstDigitIndex).trim(),
        dosage: raw.slice(firstDigitIndex).trim() || null,
    };
}

export function transformInventory(rows: MedicineWithStock[]): ProductCatalogItem[] {
    return rows.map((medicine) => {
        const batches = medicine.batches ?? [];
        const availableBatches = batches.filter(b => b.status === "available");
        const { genericName, dosage } = splitGenericAndDosage(medicine.genericName);

        return {
            productId: medicine.id,
            productDetails: medicine.name,
            genericName,
            dosage,
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