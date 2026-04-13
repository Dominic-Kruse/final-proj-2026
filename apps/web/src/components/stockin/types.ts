// ── Constants ─────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Analgesic","Anti-inflammatory", "Antibiotic", "Antihypertensive", "Antihistamine",
  "Antidiabetic", "Antacid / GI", "Vitamin / Supplement", "Antifungal",
  "Cardiovascular", "Respiratory", "Dermatological", "Ophthalmic",
  "Psychiatric", "Vaccine", "Other",
];

export const FORMS = [
  "Tablet", "Capsule", "Syrup / Suspension", "Drops",
  "Injection", "Cream / Ointment", "Patch", "Sachet",
  "Inhaler", "Suppository",
];

export const BASE_UNITS = ["Tablet", "Capsule", "mL", "Sachet", "Piece", "Vial", "Ampule"];
export const PACKAGE_UNITS = ["", "Box", "Blister", "Bottle", "Strip", "Pack", "Vial"];
export const STRENGTH_UNITS = ["mg", "mcg", "g", "mL", "IU", "%"];

export const DEFAULT_DATE = new Date().toISOString().slice(0, 10);

// ── Types ─────────────────────────────────────────────────────────────────────

export type StockInBatchDraft = {
  productId: number;
  productName: string;
  genericName: string;
  strengthValue: string;
  strengthUnit: string;
  category: string;
  form: string;
  batchNumber: string;
  expiryDate: string;
  inventoryLocation: string;
  quantityPackages: number;
  baseUnit: string;
  packageUnit: string;
  conversionFactor: number;
  totalBaseUnits: number;
  unitCost: number;
  sellingPrice: number;
};

export type PendingBatch = Omit<StockInBatchDraft, "productId">;