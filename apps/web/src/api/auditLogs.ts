import { apiClient } from "../lib/apiClient";

export type AuditLogRow = {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  performedBy: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
};

export type AuditLogsResponse = {
  metadata: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  data: AuditLogRow[];
};

type AuditLogsParams = {
  page?: number;
  limit?: number;
  entityType?: string;
};

async function getPage(params: AuditLogsParams = {}): Promise<AuditLogsResponse> {
  const res = await apiClient.get("/audit-logs", { params });
  return res.data as AuditLogsResponse;
}

export const auditLogsApi = {
  getPage,
};
