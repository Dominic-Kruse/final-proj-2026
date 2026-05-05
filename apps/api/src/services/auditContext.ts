import { Request } from "express";
import { AuditActorContext } from "./auditService";

export function getAuditActorContext(req: Request): AuditActorContext {
  const bodyPerformedBy =
    req.body && typeof req.body.performedBy === "string"
      ? req.body.performedBy.trim()
      : undefined;

  const headerPerformedBy =
    typeof req.headers["x-user-id"] === "string"
      ? req.headers["x-user-id"].trim()
      : undefined;

  const ipAddress = req.ip || req.socket?.remoteAddress;
  const userAgentHeader = req.headers["user-agent"];
  const userAgent = Array.isArray(userAgentHeader)
    ? userAgentHeader.join(",")
    : userAgentHeader;

  return {
    performedBy: bodyPerformedBy || headerPerformedBy || "system",
    ipAddress: ipAddress || undefined,
    userAgent,
  };
}
