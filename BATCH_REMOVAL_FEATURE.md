# Auto-Remove Fully Dispensed Batches from Inventory

## 📋 Objective
When a batch is **fully dispensed** (currentQuantity reaches 0), automatically remove it from the `inventory_batches` table—but **only after** the audit logs have captured the transaction for historical record-keeping.

### Example Flow
```
User dispenses the last 10 tablets of Paracetamol batch #B12345
  ↓
currentQuantity: 10 → 0
  ↓
Audit log is created (documenting the final dispensal)
  ↓
Batch is deleted from inventory_batches
  ↓
Future queries won't show the batch (cleanup complete)
```

---

## 🎯 Requirements

### Functional Requirements
1. **Detection**: When a dispense operation brings `currentQuantity` to 0, flag the batch for removal
2. **Audit Safety**: Ensure audit logs are created BEFORE the batch is removed from the database
3. **Data Integrity**: Never delete a batch that still has audit references pending
4. **Status Tracking**: Use a batch status field to mark batches as "dispensed" or "archived" before deletion
5. **No Data Loss**: All historical data remains accessible through `audit_logs` and `stock_transactions`

### Non-Functional Requirements
- Atomic transactions (audit log + deletion happen together or not at all)
- No race conditions (concurrent dispense operations shouldn't cause issues)
- Minimal performance impact on dispense operations
- Clear audit trail showing when/why batches were removed

---

## 🏗️ Current System Architecture

### Key Tables
- **`inventory_batches`**: Physical stock records with `currentQuantity`, `status`
- **`stock_transactions`**: Detailed transaction log for each stock change
- **`audit_logs`**: General audit trail for all mutations

### Current Dispense Flow (StockOutCommand)
1. Validate items
2. Start transaction
3. Fetch batch (for consistent read)
4. Deduct quantity: `currentQuantity = currentQuantity - item.quantity`
5. Insert `stock_transactions` record
6. Insert `audit_logs` record
7. Commit transaction

---

## 💡 Implementation Strategy

### Option A: Soft Delete (Recommended)
**Mark batches as "dispensed" rather than physically deleting them**

**Advantages:**
- Safer—data remains recoverable
- No referential integrity issues
- Audit logs always have accessible batch references
- Simpler to implement

**Implementation:**
1. Add a `deletedAt` field (timestamp) to `inventory_batches` table, OR use `status` field
2. After dispensing, when `currentQuantity === 0`, set `status = 'dispensed'` or `deletedAt = NOW()`
3. Update inventory queries to filter out `status = 'dispensed'` batches
4. Audit logs remain unchanged (they already reference the batch ID)

### Option B: Hard Delete (More Cleanup-Oriented)
**Physically remove the batch record after ensuring all audit data is captured**

**Advantages:**
- Complete cleanup—no "deleted" records cluttering the database
- Smaller database footprint over time

**Disadvantages:**
- More complex logic (must verify no orphaned audit logs)
- Requires careful transaction management
- Harder to recover if something goes wrong

**Implementation:**
1. In `StockOutCommand.runTransaction()`, check if `newQuantity === 0`
2. If true, instead of just updating, add a flag: `toBeDeleted = true`
3. After the transaction commits, schedule/trigger a cleanup process
4. Cleanup verifies audit logs exist, then deletes the batch

---

## 🛠️ Recommended Implementation (Option A)

### Step 1: Update Database Schema
Add status tracking (if not already sufficient):

```sql
-- If using status field (check current implementation)
-- Ensure status values include: 'available', 'dispensed', 'expired', 'recalled'

-- Alternative: Add soft-delete timestamp
ALTER TABLE inventory_batches ADD COLUMN deleted_at TIMESTAMP NULL;
```

### Step 2: Modify StockOutCommand
Update the command to mark batches as dispensed when fully emptied:

```typescript
// In StockOutCommand.ts - runTransaction() method

// After deducting stock:
const newQuantity = batch.currentQuantity - item.quantity;

// Check if batch is now fully dispensed
const isFullyDispensed = newQuantity === 0;

if (isFullyDispensed) {
  // Mark batch as dispensed instead of just deducting
  await tx
    .update(inventoryBatches)
    .set({ 
      currentQuantity: 0, 
      status: 'dispensed'  // or deletedAt: new Date()
    })
    .where(eq(inventoryBatches.id, item.batchId));
} else {
  // Normal deduction
  await tx
    .update(inventoryBatches)
    .set({ currentQuantity: newQuantity })
    .where(eq(inventoryBatches.id, item.batchId));
}

// Audit logging happens AFTER status update (atomic transaction)
await logAuditEvent(tx, {
  action: 'stock_outward',
  entityType: 'inventory_batch',
  entityId: item.batchId,
  oldValues: { /* ... */ },
  newValues: { 
    newQuantity, 
    finalStatus: isFullyDispensed ? 'dispensed' : 'available',
    // ... other fields
  },
  context: actorContext
});
```

### Step 3: Update Inventory Queries
Exclude dispensed batches from normal inventory views:

```typescript
// In inventoryController.ts - getAllInventory()

const whereClause = search
  ? or(
      ilike(products.name, `%${search}%`),
      ilike(products.genericName, `%${search}%`),
    )
  : undefined;

// Add status filter
const inventoryWhere = whereClause
  ? and(
      whereClause,
      eq(inventoryBatches.status, 'available')  // or check deletedAt is null
    )
  : eq(inventoryBatches.status, 'available');
```

### Step 4: Audit Log Verification Endpoint (Optional)
Create an endpoint to verify a batch was properly cleaned up:

```typescript
async getBatchAuditHistory(batchId: number) {
  // Returns all audit logs and stock transactions for the batch
  // Useful for verifying audit trail before deletion
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.entityId, batchId));
  
  const transactions = await db
    .select()
    .from(stockTransactions)
    .where(eq(stockTransactions.batchId, batchId));
  
  return { logs, transactions };
}
```

---

## 🔄 Transaction Safety Guarantees

The approach ensures:
1. **Atomicity**: Status update + audit log creation happen in one transaction
2. **Consistency**: Audit logs are created BEFORE batch cleanup
3. **Isolation**: Concurrent dispense operations on different batches don't interfere
4. **Durability**: Once committed, the state is permanent

---

## 📊 Example: Paracetamol Batch Lifecycle

```
Initial State:
  Batch #B12345: currentQuantity=50, status='available'
  
Dispense 30 tablets:
  → currentQuantity=20, status='available'
  ✓ Audit log created

Dispense 20 tablets:
  → currentQuantity=0, status='dispensed'
  ✓ Audit log created
  ✓ Batch removed from active inventory views
  
Later queries:
  getAllInventory() → Won't show batch #B12345
  getAuditHistory(B12345) → Still shows all transactions
  Database → Batch record still exists (soft delete)
```

---

## ✅ Checklist for Implementation

- [ ] Review current `inventoryBatches` schema for status/deleted_at field
- [ ] Update database migration if needed
- [ ] Modify `StockOutCommand.runTransaction()` to detect fully dispensed batches
- [ ] Update batch status to 'dispensed' when `currentQuantity === 0`
- [ ] Update all inventory queries to exclude dispensed batches
- [ ] Test: Dispense batch partially, verify it stays visible
- [ ] Test: Dispense batch fully, verify it's marked as dispensed
- [ ] Test: Verify audit logs are created before status change
- [ ] Add a cleanup utility (optional, for future hard-delete capability)
- [ ] Document the status values and lifecycle in schema comments
- [ ] Update API documentation

---

## 🚨 Potential Issues & Mitigations

| Issue | Risk | Mitigation |
|-------|------|-----------|
| Concurrent dispense to same batch | Race condition | Database-level transaction isolation |
| Audit logs not created before delete | Data inconsistency | Use atomic transaction, test thoroughly |
| Queries still show dispensed batches | Confusing UX | Update all queries to filter by status |
| Hard-delete orphans audit references | FK constraints | Stick with soft delete (status field) |
| Too many "dispensed" records in DB | Performance | Implement periodic archival/purge (future work) |

---

## 📚 References

- **Audit Service**: `apps/api/src/services/auditService.ts`
- **Stock Out Command**: `apps/api/src/commands/StockOutCommand.ts`
- **Inventory Controller**: `apps/api/src/controllers/inventoryController.ts`
- **DB Schema**: `apps/api/src/db/schema.ts`

---

## Next Steps

1. **Decide**: Option A (soft delete) vs Option B (hard delete)?
2. **Implement**: Follow the recommended steps above
3. **Test**: Unit tests + integration tests for edge cases
4. **Deploy**: Roll out with monitoring for any issues
