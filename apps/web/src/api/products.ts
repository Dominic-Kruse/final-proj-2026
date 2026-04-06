import {apiClient} from "../lib/apiClient";
import type { Medicine } from "../utils/types";

export const productsApi = {
    getAll: async (): Promise<Medicine[]> => {
        const res = await apiClient.get("/products");
        return res.data;
    },

    getById: async (id: number): Promise<Medicine> => {
        const res = await apiClient.get(`products/${id}`);
        return res.data;
    },

    create: async (data: Omit<Medicine, "id" | "updatedAt">): Promise<Medicine> => {
        const res = await apiClient.post("/products", data);
        return res.data;
    },

    update: async ( id:number, data: Partial<Medicine>): Promise<Medicine> => {
        const res = await apiClient.put(`/products/${id}`, data);
        return res.data
    },

    delete: async (id: number): Promise<{message: string}> => {
        const res = await apiClient.delete(`/products/${id}`);
        return res.data;
    },
}