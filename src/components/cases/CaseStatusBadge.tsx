import clsx from "clsx";
import type { CaseStatus } from "@/types/case";

const STATUS_LABEL: Record<CaseStatus, string> = {
  opened: "Opened",
  in_progress: "In progress",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_CLASS: Record<CaseStatus, string> = {
  opened: "bg-risk-info/15 text-risk-info",
  in_progress: "bg-risk-medium/15 text-risk-medium",
  escalated: "bg-risk-critical/15 text-risk-critical",
  resolved: "bg-risk-low/15 text-risk-low",
  closed: "bg-surface-raised text-ink-faint",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
