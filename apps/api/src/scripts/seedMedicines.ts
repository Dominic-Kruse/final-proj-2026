import { and, eq } from "drizzle-orm";
import { db, pool } from "../db";
import { inventoryBatches, products } from "../db/schema";

type SeedMedicine = {
  sku: string;
  name: string;
  genericName: string;
  dosage: string;
  description: string;
  category: string;
  form: string;
  baseUnit: string;
  packageUnit: string;
  conversionFactor: number;
  isPrescriptionRequired: boolean;
  requiresColdChain: boolean;
  reorderLevel: number;
};

function combineGenericNameAndDosage(genericName: string, dosage: string): string {
  const generic = genericName.trim();
  const dose = dosage.trim();
  return dose ? `${generic} ${dose}` : generic;
}

type SeedBatch = {
  productSku: string;
  batchNumber: string;
  supplierName: string;
  referenceNumber: string;
  inventoryLocation: string;
  expiryDate: string;
  receivedDate: string;
  quantity: number;
  costPrice: string;
  sellingPrice: string;
  status: "available" | "expired" | "recalled" | "quarantine";
};

const SAMPLE_MEDICINES: SeedMedicine[] = [
  {
    sku: "MED-PARA-500-TAB",
    name: "Biogesic",
    genericName: "Paracetamol",
    dosage: "500mg",
    description: "For fever and mild pain relief.",
    category: "Analgesic",
    form: "Tablet",
    baseUnit: "Tablet",
    packageUnit: "Box",
    conversionFactor: 100,
    isPrescriptionRequired: false,
    requiresColdChain: false,
    reorderLevel: 50,
  },
  {
    sku: "MED-AMOX-500-CAP",
    name: "Amoxil",
    genericName: "Amoxicillin",
    dosage: "500mg",
    description: "Broad-spectrum antibiotic capsule.",
    category: "Antibiotic",
    form: "Capsule",
    baseUnit: "Capsule",
    packageUnit: "Box",
    conversionFactor: 100,
    isPrescriptionRequired: true,
    requiresColdChain: false,
    reorderLevel: 40,
  },
  {
    sku: "MED-METF-500-TAB",
    name: "Glucophage",
    genericName: "Metformin",
    dosage: "500mg",
    description: "First-line medicine for type 2 diabetes.",
    category: "Antidiabetic",
    form: "Tablet",
    baseUnit: "Tablet",
    packageUnit: "Box",
    conversionFactor: 100,
    isPrescriptionRequired: true,
    requiresColdChain: false,
    reorderLevel: 60,
  },
  {
    sku: "MED-ATOR-20-TAB",
    name: "Lipitor",
    genericName: "Atorvastatin",
    dosage: "20mg",
    description: "Lipid-lowering medicine.",
    category: "Cardiovascular",
    form: "Tablet",
    baseUnit: "Tablet",
    packageUnit: "Box",
    conversionFactor: 30,
    isPrescriptionRequired: true,
    requiresColdChain: false,
    reorderLevel: 30,
  },
  {
    sku: "MED-LOSR-50-TAB",
    name: "Cozaar",
    genericName: "Losartan",
    dosage: "50mg",
    description: "Antihypertensive angiotensin receptor blocker.",
    category: "Cardiovascular",
    form: "Tablet",
    baseUnit: "Tablet",
    packageUnit: "Box",
    conversionFactor: 30,
    isPrescriptionRequired: true,
    requiresColdChain: false,
    reorderLevel: 30,
  },
  {
    sku: "MED-OMEP-20-CAP",
    name: "Losec",
    genericName: "Omeprazole",
    dosage: "20mg",
    description: "For acid reflux and ulcer care.",
    category: "Gastrointestinal",
    form: "Capsule",
    baseUnit: "Capsule",
    packageUnit: "Box",
    conversionFactor: 30,
    isPrescriptionRequired: false,
    requiresColdChain: false,
    reorderLevel: 25,
  },
  {
    sku: "MED-CETR-10-TAB",
    name: "Zyrtec",
    genericName: "Cetirizine",
    dosage: "10mg",
    description: "Antihistamine for allergy symptoms.",
    category: "Antihistamine",
    form: "Tablet",
    baseUnit: "Tablet",
    packageUnit: "Box",
    conversionFactor: 20,
    isPrescriptionRequired: false,
    requiresColdChain: false,
    reorderLevel: 20,
  },
  {
    sku: "MED-SALB-2-SYP",
    name: "Ventolin Syrup",
    genericName: "Salbutamol",
    dosage: "2mg/5mL",
    description: "Bronchodilator syrup for airway relief.",
    category: "Respiratory",
    form: "Syrup",
    baseUnit: "mL",
    packageUnit: "Bottle",
    conversionFactor: 60,
    isPrescriptionRequired: true,
    requiresColdChain: false,
    reorderLevel: 120,
  },
  {
    sku: "MED-INSU-REG-VIAL",
    name: "Humulin R",
    genericName: "Regular Human Insulin",
    dosage: "100IU/mL",
    description: "Short-acting insulin vial.",
    category: "Antidiabetic",
    form: "Injection",
    baseUnit: "mL",
    packageUnit: "Vial",
    conversionFactor: 10,
    isPrescriptionRequired: true,
    requiresColdChain: true,
    reorderLevel: 20,
  },
  {
    sku: "MED-AZITH-500-TAB",
    name: "Zithromax",
    genericName: "Azithromycin",
    dosage: "500mg",
    description: "Macrolide antibiotic tablet.",
    category: "Antibiotic",
    form: "Tablet",
    baseUnit: "Tablet",
    packageUnit: "Blister",
    conversionFactor: 3,
    isPrescriptionRequired: true,
    requiresColdChain: false,
    reorderLevel: 15,
  },
];

const SAMPLE_BATCHES: SeedBatch[] = [
  {
    productSku: "MED-PARA-500-TAB",
    batchNumber: "PARA-2026-A",
    supplierName: "Mercury Drug Supplier",
    referenceNumber: "INV-PARA-001",
    inventoryLocation: "Main Shelf A1",
    expiryDate: "2027-12-31",
    receivedDate: "2026-03-01",
    quantity: 500,
    costPrice: "2.50",
    sellingPrice: "4.00",
    status: "available",
  },
  {
    productSku: "MED-PARA-500-TAB",
    batchNumber: "PARA-2026-B",
    supplierName: "Mercury Drug Supplier",
    referenceNumber: "INV-PARA-002",
    inventoryLocation: "Main Shelf A1",
    expiryDate: "2028-01-15",
    receivedDate: "2026-04-10",
    quantity: 400,
    costPrice: "2.55",
    sellingPrice: "4.10",
    status: "available",
  },
  {
    productSku: "MED-AMOX-500-CAP",
    batchNumber: "AMOX-2026-A",
    supplierName: "Unilab Distributor",
    referenceNumber: "INV-AMOX-001",
    inventoryLocation: "Main Shelf B2",
    expiryDate: "2027-10-30",
    receivedDate: "2026-02-20",
    quantity: 300,
    costPrice: "6.80",
    sellingPrice: "9.50",
    status: "available",
  },
  {
    productSku: "MED-METF-500-TAB",
    batchNumber: "METF-2026-A",
    supplierName: "Southstar Wholesale",
    referenceNumber: "INV-METF-001",
    inventoryLocation: "Main Shelf C1",
    expiryDate: "2027-11-15",
    receivedDate: "2026-03-18",
    quantity: 450,
    costPrice: "3.40",
    sellingPrice: "5.20",
    status: "available",
  },
  {
    productSku: "MED-INSU-REG-VIAL",
    batchNumber: "INSU-2026-COLD-A",
    supplierName: "ColdChain Pharma",
    referenceNumber: "INV-INSU-001",
    inventoryLocation: "Refrigerator 1",
    expiryDate: "2027-06-30",
    receivedDate: "2026-04-02",
    quantity: 60,
    costPrice: "180.00",
    sellingPrice: "245.00",
    status: "available",
  },
  {
    productSku: "MED-SALB-2-SYP",
    batchNumber: "SALB-2026-A",
    supplierName: "Respira Care Supply",
    referenceNumber: "INV-SALB-001",
    inventoryLocation: "Syrup Rack D4",
    expiryDate: "2027-09-01",
    receivedDate: "2026-04-05",
    quantity: 120,
    costPrice: "45.00",
    sellingPrice: "68.00",
    status: "available",
  },
];

async function seedMedicines() {
  let inserted = 0;
  let skipped = 0;

  for (const medicine of SAMPLE_MEDICINES) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, medicine.sku))
      .limit(1);

    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    await db.insert(products).values({
      ...medicine,
      genericName: combineGenericNameAndDosage(medicine.genericName, medicine.dosage),
    });
    inserted += 1;
  }

  const seededSkus = SAMPLE_MEDICINES.map((m) => m.sku);

  // Expand lookup by querying each configured SKU for compatibility with current query helpers.
  const skuToProductId = new Map<string, number>();
  for (const sku of seededSkus) {
    const found = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    if (found[0]?.id) {
      skuToProductId.set(sku, found[0].id);
    }
  }

  let batchInserted = 0;
  let batchSkipped = 0;

  for (const batch of SAMPLE_BATCHES) {
    const productId = skuToProductId.get(batch.productSku);
    if (!productId) {
      batchSkipped += 1;
      continue;
    }

    const existingBatch = await db
      .select({ id: inventoryBatches.id })
      .from(inventoryBatches)
      .where(
        and(
          eq(inventoryBatches.productId, productId),
          eq(inventoryBatches.batchNumber, batch.batchNumber),
        ),
      )
      .limit(1);

    if (existingBatch.length > 0) {
      batchSkipped += 1;
      continue;
    }

    await db.insert(inventoryBatches).values({
      productId,
      batchNumber: batch.batchNumber,
      supplierName: batch.supplierName,
      referenceNumber: batch.referenceNumber,
      inventoryLocation: batch.inventoryLocation,
      expiryDate: batch.expiryDate,
      receivedDate: batch.receivedDate,
      initialQuantity: batch.quantity,
      currentQuantity: batch.quantity,
      costPrice: batch.costPrice,
      sellingPrice: batch.sellingPrice,
      status: batch.status,
    });

    batchInserted += 1;
  }

  console.log(`[seed] Medicines inserted: ${inserted}, skipped: ${skipped}`);
  console.log(`[seed] Batches inserted: ${batchInserted}, skipped: ${batchSkipped}`);
}

seedMedicines()
  .catch((error) => {
    console.error("[seed] Failed to seed sample medicines:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
