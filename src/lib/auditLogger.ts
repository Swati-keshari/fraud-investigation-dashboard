import type { AuditActionType } from "@/types/case";

const ACTION_VERB: Record<AuditActionType, string> = {
  approve: "approved",
  decline: "declined",
  escalate: "escalated",
  create_case: "opened a case from",
  case_status_change: "changed status of",
  note_added: "added a note to",
  bulk_action: "ran a bulk action on",
};

/** Renders one audit-log row's sentence: "A. Reyes approved ALT-300142". */
export function describeAuditEntry(entry: {
  actor: string;
  action: string;
  targetId: string;
}): string {
  const verb = ACTION_VERB[entry.action as AuditActionType] ?? entry.action;
  return `${entry.actor} ${verb} ${entry.targetId}`;
}

export function formatAuditTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
