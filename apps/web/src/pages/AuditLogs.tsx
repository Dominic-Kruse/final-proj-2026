import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auditLogsApi } from "../api/auditLogs";
import { inventoryApi } from "../api/inventory";

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function summarizeJson(value: string | null) {
  if (!value) {
    return { preview: "—", full: "—" };
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { preview: String(parsed), full: value };
    }

    const entries = Object.entries(parsed)
      .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined)
      .map(([key, entryValue]) => {
        const entryText = typeof entryValue === "string"
          ? entryValue
          : JSON.stringify(entryValue);
        const short = entryText.length > 40 ? `${entryText.slice(0, 40)}…` : entryText;
        return `${key}: ${short}`;
      });

    const visibleLines = entries.slice(0, 5);
    if (entries.length > visibleLines.length) {
      visibleLines.push(`+${entries.length - visibleLines.length} more fields`);
    }

    return {
      preview: visibleLines.length > 0 ? visibleLines.join("\n") : "—",
      full: JSON.stringify(parsed, null, 2),
    };
  } catch {
    const short = value.length > 220 ? `${value.slice(0, 220)}…` : value;
    return { preview: short, full: value };
  }
}

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </span>
  );
}

export function AuditLogs() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const queryClient = useQueryClient();
  const [undoingBatchId, setUndoingBatchId] = useState<number | null>(null);
  const [undoMessage, setUndoMessage] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["audit-logs", page, limit],
    queryFn: () => auditLogsApi.getPage({ page, limit }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const undoMutation = useMutation({
    mutationFn: (batchId: number) => inventoryApi.undoDispense(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setUndoMessage("Dispense undone successfully!");
      setTimeout(() => setUndoMessage(""), 3000);
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || "Failed to undo dispense";
      setUndoMessage(`Error: ${errorMsg}`);
      setTimeout(() => setUndoMessage(""), 3000);
    },
  });

  const rows = data?.data ?? [];
  const metadata = data?.metadata;

  const rangeLabel = useMemo(() => {
    if (!metadata || metadata.totalCount === 0) return "0 of 0";
    const start = (metadata.currentPage - 1) * metadata.limit + 1;
    const end = Math.min(metadata.currentPage * metadata.limit, metadata.totalCount);
    return `${start}–${end} of ${metadata.totalCount}`;
  }, [metadata]);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review who changed what, when it changed, and the before/after values.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-500 shadow-sm">
          <span>Page {metadata?.currentPage ?? 1}</span>
          <span className="text-slate-300">•</span>
          <span>Total {metadata?.totalCount ?? 0}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{rangeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!metadata || metadata.currentPage === 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!metadata || metadata.currentPage >= metadata.totalPages}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {undoMessage && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          undoMessage.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
        }`}>
          {undoMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Log entries</h2>
              <p className="mt-1 text-xs text-slate-400">Product and stock mutations captured by the API.</p>
            </div>
            {isFetching && !isLoading && (
              <span className="text-xs font-medium text-slate-400">Refreshing…</span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            Loading audit logs...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-full bg-slate-100 px-4 py-4 text-slate-400">No logs yet</div>
            <p className="text-sm text-slate-500">Audit entries will appear here after product or inventory updates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-300 w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Actor</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Entity</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Entity ID</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">IP</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">User agent</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Old values</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">New values</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const oldSummary = summarizeJson(row.oldValues);
                  const newSummary = summarizeJson(row.newValues);

                  return (
                    <tr key={row.id} className="align-top transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {formatTimestamp(row.createdAt)}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-700">
                        {row.performedBy ?? "system"}
                      </td>
                      <td className="px-3 py-4">
                        <Badge>{row.action}</Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-700">
                        {row.entityType}
                      </td>
                      <td className="px-3 py-4 text-sm font-semibold text-slate-800">
                        {row.entityId}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-500">
                        {row.ipAddress ?? "—"}
                      </td>
                      <td className="px-3 py-4 text-xs text-slate-500">
                        <div className="max-w-55 truncate" title={row.userAgent ?? undefined}>
                          {row.userAgent ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-xs text-slate-500">
                        <div
                          className="max-w-60 whitespace-pre-line wrap-break-word rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] leading-5 text-slate-600"
                          title={oldSummary.full}
                        >
                          {oldSummary.preview}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-xs text-slate-500">
                        <div
                          className="max-w-60 whitespace-pre-line wrap-break-word rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] leading-5 text-slate-600"
                          title={newSummary.full}
                        >
                          {newSummary.preview}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {row.action === "stock_outward" && row.entityType === "inventory_batch" ? (
                          <button
                            onClick={() => {
                              setUndoingBatchId(row.entityId);
                              undoMutation.mutate(row.entityId);
                            }}
                            disabled={undoMutation.isPending}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {undoMutation.isPending && undoingBatchId === row.entityId ? "Undoing..." : "Undo"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
