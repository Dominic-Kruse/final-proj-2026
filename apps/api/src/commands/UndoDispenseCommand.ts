import { db } from "../db";
import { inventoryBatches, stockTransactions } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { type AuditActorContext, logAuditEvent } from "../services/auditService";
import { type Command } from "./BaseCommand";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UndoDispensePayload {
  batchId: number;
  performedBy?: string;
  actorContext?: AuditActorContext;
}

export interface UndoDispenseResult {
  message: string;
  batchId: number;
  quantityRestored: number;
}

// ── Typed validation error ─────────────────────────────────────────────────────
export class UndoDispenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UndoDispenseValidationError";
  }
}

// ── Command ────────────────────────────────────────────────────────────────────
export class UndoDispenseCommand implements Command<UndoDispenseResult> {
  private payload: UndoDispensePayload;

  constructor(payload: UndoDispensePayload) {
    this.payload = payload;
  }

  // ── Public entry point (Command interface) ───────────────────────────────────
  async execute(): Promise<UndoDispenseResult> {
    this.validate();
    const result = await this.runTransaction();
    return {
      message: `Undo successful. Restored ${result.quantityRestored} unit(s) to batch ${this.payload.batchId}.`,
      batchId: this.payload.batchId,
      quantityRestored: result.quantityRestored,
    };
  }

  // ── Step 1: validate ─────────────────────────────────────────────────────────
  private validate(): void {
    const { batchId } = this.payload;

    if (!Number.isFinite(batchId) || batchId <= 0)
      throw new UndoDispenseValidationError("Invalid batchId");
  }

  // ── Step 2: execute transaction ──────────────────────────────────────────────
  private async runTransaction(): Promise<{ quantityRestored: number }> {
    const { batchId, performedBy, actorContext } = this.payload;
    const actor = performedBy?.trim() || "Unknown";

    return db.transaction(async (tx) => {
      // Fetch the batch — allow available OR dispensed (undo works on both)
      const [batch] = await tx
        .select()
        .from(inventoryBatches)
        .where(eq(inventoryBatches.id, batchId))
        .for("update")
        .limit(1);

      if (!batch)
        throw new UndoDispenseValidationError(`Batch ${batchId} not found`);

      if (batch.status === "expired" || batch.status === "recalled")
        throw new UndoDispenseValidationError(
          `Cannot undo dispense on a batch with status '${batch.status}'`
        );

      // Find the most recent outward transaction for this batch
      const [lastTransaction] = await tx
        .select()
        .from(stockTransactions)
        .where(
          and(
            eq(stockTransactions.batchId, batchId),
            eq(stockTransactions.type, "outward"),
          )
        )
        .orderBy(desc(stockTransactions.createdAt), desc(stockTransactions.id))
        .limit(1);

      if (!lastTransaction)
        throw new UndoDispenseValidationError(
          `No outward transaction found for batch ${batchId}`
        );

      // quantityChanged is stored as negative for outward (e.g. -10)
      const quantityToRestore = Math.abs(lastTransaction.quantityChanged);
      const newQuantity = batch.currentQuantity + quantityToRestore;

      // Restore quantity and flip status back to available
      await tx
        .update(inventoryBatches)
        .set({
          currentQuantity: newQuantity,
          status: "available",
        })
        .where(eq(inventoryBatches.id, batchId));

      // Insert a reversal transaction for the audit trail
      await tx.insert(stockTransactions).values({
        batchId,
        type: "adjustment",
        quantityChanged: quantityToRestore,
        reason: `Undo of dispense transaction #${lastTransaction.id}`,
        performedBy: actor,
      });

      await logAuditEvent(tx, {
        action: "undo_dispense",
        entityType: "inventory_batch",
        entityId: batchId,
        oldValues: {
          currentQuantity: batch.currentQuantity,
          status: batch.status,
          reversedTransactionId: lastTransaction.id,
        },
        newValues: {
          currentQuantity: newQuantity,
          status: "available",
          quantityRestored: quantityToRestore,
        },
        context: actorContext ?? { performedBy: actor },
      });

      return { quantityRestored: quantityToRestore };
    });
  }
}