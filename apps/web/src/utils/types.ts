export interface Medicine {
    id: number; 
    sku: string; 
    name: string;
    genericName: string;
    description?: string;
    category?: string | null;
    form?: string | null;
    baseUnit: string;
    packageUnit?: string | null;
    conversionFactor: number;
    isPrescriptionRequired: boolean;
    requiresColdChain: boolean;
    reorderLevel: number;
    updatedAt: string;
}

export interface Batch {
    id: number;
    productId: number; 
    batchNumber: string;
    supplierId?: number;
    inventoryLocation: string;
    expiryDate: string; 
    receivedDate: string;
    initialQuantity: number;
    currentQuantity: number;
    costPrice: string; 
    sellingPrice: string;
    status: 'available' | 'expired' | 'recalled' | 'quarantine';
}

/**
 * JOINED TYPE: This is what you will likely use for 
 * the Dashboard and Inventory Table
 */
export interface MedicineWithStock extends Medicine {
    batches: Batch[];
    totalStock: number; // Sum of all currentQuantity in batches
}