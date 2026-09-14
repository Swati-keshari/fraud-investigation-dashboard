"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCaseQuery } from "@/hooks/useCaseMutations";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { InvestigationLog } from "./InvestigationLog";

// React Flow is one of the heaviest deps in the project — code-split it
// behind next/dynamic so it never loads on the alert-triage-only path.
const CaseWorkflowGraph = dynamic(
  () => import("./CaseWorkflowGraph").then((m) => m.CaseWorkflowGraph),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded bg-surface-raised" /> }
);

export function CaseDetailPage({ caseId }: { caseId: string }) {
  const { data: caseRecord, isLoading } = useCaseQuery(caseId);

  if (isLoading) {
    return <div className="m-4 h-40 animate-pulse rounded bg-surface-raised" />;
  }

  if (!caseRecord) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-ink">Case {caseId} not found.</p>
        <Link href="/cases" className="text-sm text-risk-info hover:underline">
          Back to case board
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Link href="/cases" className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink">
        <ArrowLeft size={12} /> Case board
      </Link>

      <div className="flex items-start justify-between rounded border border-border bg-surface p-4">
        <div>
          <p className="font-mono text-xs text-ink-faint">{caseRecord.caseId}</p>
          <h2 className="mt-0.5 text-base font-medium text-ink">{caseRecord.title}</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {caseRecord.assignedAnalyst ?? "Unassigned"} · from alert{" "}
            <span className="font-mono">{caseRecord.alertId}</span>
          </p>
        </div>
        <CaseStatusBadge status={caseRecord.status} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">Workflow</h3>
        <CaseWorkflowGraph caseId={caseRecord.caseId} status={caseRecord.status} />
        <p className="mt-1.5 text-xs text-ink-faint">Click the highlighted next step to advance the case.</p>
      </div>

      <InvestigationLog caseId={caseRecord.caseId} />
    </div>
  );
}
