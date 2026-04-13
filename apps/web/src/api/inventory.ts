import { apiClient } from "../lib/apiClient";
import type { Batch, MedicineWithStock } from "../utils/types";

export const inventoryApi = {
    getAll: async (): Promise<MedicineWithStock[]> => {
        const res = await apiClient.get("/inventory");
        return res.data;
    },

    getById: async (id: number): Promise<MedicineWithStock> => {
        const res = await apiClient.get(`/inventory/${id}`);
        return res.data;
    },

    stockInward: async (payload: {
        supplierName: string;
        referenceNumber: string;
        dateReceived: string;
        batches: {
            productId: number;
            batchNumber: string;
            expiryDate: string;
            // Quantity is always in BASE units (already converted before calling this)
            quantity: number;
            unitCost: number;
            sellingPrice: number;
            inventoryLocation?: string;
        }[];
        performedBy?: string;
    }): Promise<{ message: string; batches: Batch[] }> => {
        const res = await apiClient.post("/inventory/stock-inward", payload);
        return res.data;
    },

    stockOutward: async (payload: {
        items: {
            batchId: number;
            quantity: number;
            reason: string;
        }[];
        performedBy?: string;
    }): Promise<{ message: string }> => {
        const res = await apiClient.post("/inventory/stock-outward", payload);
        return res.data;
    },
};