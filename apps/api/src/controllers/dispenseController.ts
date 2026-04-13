import { db } from "../db";
import { inventoryBatches, stockTransactions } from "../db/schema";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";

function handleError(res: Response, error: unknown, message: string) {
	console.error(`[dispenseController] ${message}:`, error);
	res.status(500).json({ error: message });
}

export const dispenseController = {
	async stockOutward(req: Request, res: Response) {
		try {
			const { items, performedBy } = req.body as {
				items: { batchId: number; quantity: number; reason: string }[];
				performedBy?: string;
			};

			if (!Array.isArray(items) || items.length === 0) {
				res.status(400).json({ error: "At least one item is required" });
				return;
			}

			await db.transaction(async (tx) => {
				for (const item of items) {
					const [batch] = await tx
						.select()
						.from(inventoryBatches)
						.where(eq(inventoryBatches.id, item.batchId))
						.limit(1);

					if (!batch) throw new Error(`Batch ${item.batchId} not found`);
					if (batch.currentQuantity < item.quantity) {
						throw new Error(`Insufficient stock for batch ${batch.batchNumber}`);
					}

					await tx
						.update(inventoryBatches)
						.set({ currentQuantity: batch.currentQuantity - item.quantity })
						.where(eq(inventoryBatches.id, item.batchId));

					await tx.insert(stockTransactions).values({
						batchId: item.batchId,
						type: "sale",
						quantityChanged: -item.quantity,
						reason: item.reason,
						performedBy: performedBy ?? "system",
					});
				}
			});

			res.json({ message: `Dispensed ${items.length} batch(es) successfully.` });
		} catch (error) {
			handleError(res, error, "Failed to process dispense");
		}
	},
};
