import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  date, 
  decimal, 
  timestamp, 
  boolean 
} from 'drizzle-orm/pg-core';

// 1. PRODUCT MASTER
// Defines what the medicine is (The "Label")
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 100 }), // Barcode
  name: varchar('name', { length: 255 }).notNull(), // Brand Name
  genericName: text('generic_name').notNull(),
  description: text('description'),
  
  // Categorization
  category: varchar('category', { length: 100 }), // e.g., Antibiotic, Analgesic
  form: varchar('form', { length: 50 }), // e.g., Tablet, Syrup, Capsule
  
  // Unit Management (Crucial for Pharmacy)
  baseUnit: varchar('base_unit').notNull(), // e.g., "Tablet" or "mL"
  packageUnit: varchar('package_unit'), // e.g., "Box"
  conversionFactor: integer('conversion_factor').default(1), // e.g., 100 tablets per box
  
  // Requirements
  isPrescriptionRequired: boolean('is_prescription_required').default(false),
  requiresColdChain: boolean('requires_cold_chain').default(false), // Refrigerator needed?
  
  // Stock Alerting
  reorderLevel: integer('reorder_level').default(10),
  
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. INVENTORY BATCHES
// Tracks the actual physical stock sitting on the shelf
export const inventoryBatches = pgTable('inventory_batches', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(),
  supplierId: integer('supplier_id'), // Link to a suppliers table if you have one
  
  inventoryLocation: varchar('inventory_location', {length: 100 }).notNull(),
  // Dates
  expiryDate: date('expiry_date').notNull(),
  receivedDate: date('received_date').defaultNow(),
  
  // Quantities (Always track in BASE UNITS, i.e., pieces/tablets)
  initialQuantity: integer('initial_quantity').notNull(),
  currentQuantity: integer('current_quantity').notNull(),
  
  // Pricing
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 12, scale: 2 }).notNull(),
  
  status: varchar('status').default('available'), // e.g., 'available', 'expired', 'recalled', 'quarantine'
});

// 3. STOCK TRANSACTIONS (Audit Trail)
// Never just "edit" stock; always log WHY it changed
export const stockTransactions = pgTable('stock_transactions', {
  id: serial('id').primaryKey(),
  batchId: integer('batch_id').references(() => inventoryBatches.id),
  type: varchar('type').notNull(), // 'sale', 'restock', 'return', 'adjustment', 'expired'
  quantityChanged: integer('quantity_changed').notNull(), // Positive for restock, negative for sale
  reason: text('reason'),
  performedBy: varchar('performed_by'), // User/Employee ID
  createdAt: timestamp('created_at').defaultNow(),
});