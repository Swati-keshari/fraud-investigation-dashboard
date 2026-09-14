"use client";

import Link from "next/link";
import { useCasesQuery } from "@/hooks/useCaseMutations";
import { CaseStatusBadge } from "./CaseStatusBadge";
import type { CaseStatus } from "@/types/case";

const COLUMNS: CaseStatus[] = ["opened", "in_progress", "escalated", "resolved", "closed"];

export function CaseBoardPage() {
  const { data: cases, isLoading } = useCasesQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((c) => (
          <div key={c} className="h-40 animate-pulse rounded bg-surface-raised" />
        ))}
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-8 text-center">
        <p className="text-sm text-ink">No cases yet.</p>
        <p className="text-xs text-ink-faint">
          Escalate an alert or create a case from the alert queue to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 gap-3 overflow-x-auto p-4 sm:grid-cols-3 lg:grid-cols-5">
      {COLUMNS.map((status) => {
        const columnCases = cases.filter((c) => c.status === status);
        return (
          <div key={status} className="flex min-w-[220px] flex-col rounded border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <CaseStatusBadge status={status} />
              <span className="text-xs text-ink-faint">{columnCases.length}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
              {columnCases.map((c) => (
                <Link
                  key={c.caseId}
                  href={`/cases/${c.caseId}`}
                  className="block rounded border border-border bg-surface-raised p-2.5 hover:border-border-strong"
                >
                  <p className="font-mono text-xs text-ink-faint">{c.caseId}</p>
                  <p className="mt-0.5 text-sm text-ink">{c.title}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {c.assignedAnalyst ?? "Unassigned"} · {c.priority}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
