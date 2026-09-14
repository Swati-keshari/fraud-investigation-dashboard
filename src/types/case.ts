export type CaseStatus = "opened" | "in_progress" | "escalated" | "resolved" | "closed";

export interface CaseRecord {
  caseId: string;
  alertId: string;
  title: string;
  status: CaseStatus;
  priority: "standard" | "high" | "critical";
  assignedAnalyst: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationLogEntry {
  id: string;
  caseId: string;
  author: string;
  body: string;
  step: string | null;
  createdAt: string;
}

export type AuditActionType =
  | "approve"
  | "decline"
  | "escalate"
  | "create_case"
  | "case_status_change"
  | "note_added"
  | "bulk_action";

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: AuditActionType;
  targetType: "alert" | "case";
  targetId: string;
  detail: string;
  timestamp: string;
}
