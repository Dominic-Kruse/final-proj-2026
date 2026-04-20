import { auditLogs } from "../db/schema";

export interface AuditActorContext {
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogInput {
  action: "create" | "update" | "delete" | "stock_inward" | "stock_outward";
  entityType: "product" | "inventory_batch";
  entityId: number;
  oldValues?: unknown;
  newValues?: unknown;
  context?: AuditActorContext;
}

interface InsertableDb {
  insert: (table: typeof auditLogs) => {
    values: (payload: typeof auditLogs.$inferInsert) => unknown;
  };
}

export function serializeAuditValues(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ serializationError: true });
  }
}

export async function logAuditEvent(dbOrTx: InsertableDb, input: AuditLogInput): Promise<void> {
  await dbOrTx.insert(auditLogs).values({
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    performedBy: input.context?.performedBy ?? "system",
    oldValues: serializeAuditValues(input.oldValues),
    newValues: serializeAuditValues(input.newValues),
    ipAddress: input.context?.ipAddress,
    userAgent: input.context?.userAgent,
  });
}
