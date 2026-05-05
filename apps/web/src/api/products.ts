import { apiClient } from "../lib/apiClient";
import type { Medicine } from "../utils/types";

type ProductsQueryParams = {
    page?: number;
    limit?: number;
    search?: string;
};

type ProductsResponse = {
    metadata: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
    data: Medicine[];
};

// ── Create payload — explicit so packageUnit & conversionFactor are never dropped ──
export type CreateProductPayload = {
    name: string;
    genericName: string;
    dosage?: string | null;
    description?: string;
    category?: string | null;
    form?: string | null;
    baseUnit: string;
    packageUnit?: string | null;      // ← was missing from the Omit<Medicine> call sites
    conversionFactor: number;         // ← same
    isPrescriptionRequired: boolean;
    requiresColdChain: boolean;
    reorderLevel: number;
    sku?: string;
};

function combineGenericNameAndDosage(genericName: string, dosage?: string | null): string {
    const generic = genericName.trim();
    const dosageText = (dosage ?? "").trim();
    return dosageText ? `${generic} ${dosageText}` : generic;
}

async function getProductsPage(params: ProductsQueryParams = {}): Promise<ProductsResponse> {
    const res = await apiClient.get("/products", { params });

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

    return res.data;
}

async function getAllProducts(search?: string): Promise<Medicine[]> {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const allProducts: Medicine[] = [];

    do {
        const response = await getProductsPage({ page, limit: pageSize, search });
        allProducts.push(...response.data);
        totalPages = response.metadata.totalPages || 1;
        page += 1;
    } while (page <= totalPages);

    return allProducts;
}

export const productsApi = {
    getPage: getProductsPage,

    getAll: async (search?: string): Promise<Medicine[]> => {
        return getAllProducts(search);
    },

    getById: async (id: number): Promise<Medicine> => {
        const res = await apiClient.get(`products/${id}`);
        return res.data;
    },

    // ✅ Use explicit CreateProductPayload instead of Omit<Medicine, ...>
    // This ensures packageUnit and conversionFactor are always included in the request body
    create: async (data: CreateProductPayload): Promise<Medicine> => {
        const payload = {
            ...data,
            genericName: combineGenericNameAndDosage(data.genericName, data.dosage),
        };
        const res = await apiClient.post("/products", payload);
        return res.data;
    },

    update: async (id: number, data: Partial<Medicine>): Promise<Medicine> => {
        const res = await apiClient.put(`/products/${id}`, data);
        return res.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const res = await apiClient.delete(`/products/${id}`);
        return res.data;
    },
};