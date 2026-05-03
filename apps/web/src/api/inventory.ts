import { apiClient } from "../lib/apiClient";
import type { Batch, MedicineWithStock } from "../utils/types";

type InventoryQueryParams = {
    page?: number;
    limit?: number;
    search?: string;
};

export type InventoryResponse = {
    metadata: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
    data: MedicineWithStock[];
};

async function getInventoryPage(params: InventoryQueryParams = {}): Promise<InventoryResponse> {
    const res = await apiClient.get("/inventory", { params });

    if (Array.isArray(res.data)) {
        return {
            metadata: {
                currentPage: 1,
                totalPages: 1,
                totalCount: res.data.length,
                limit: res.data.length,
            },
            data: res.data,
        };
    }

    return res.data as InventoryResponse;
}

async function getAllInventory(): Promise<MedicineWithStock[]> {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const all: MedicineWithStock[] = [];

    do {
        const response = await getInventoryPage({ page, limit: pageSize });
        all.push(...response.data);
        totalPages = response.metadata.totalPages || 1;
        page += 1;
    } while (page <= totalPages);

    return all;
}

export const inventoryApi = {
    getPage: getInventoryPage,

    getAll: async (): Promise<MedicineWithStock[]> => {
        return getAllInventory();
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
    }): Promise<{ message: string; dispensedBatchIds: number[] }> => {
        const res = await apiClient.post("/inventory/stock-outward", payload);
        return res.data;
    },

    undoDispense: async (batchId: number, performedBy?: string): Promise<{
        message: string;
        batchId: number;
        quantityRestored: number;
    }> => {
        const res = await apiClient.post(`/inventory/stock-outward/undo/${batchId}`, { performedBy });
        return res.data;
    },
};