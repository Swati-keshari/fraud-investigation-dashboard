"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import { useAuditLogQuery } from "@/hooks/useCaseMutations";
import { describeAuditEntry, formatAuditTimestamp } from "@/lib/auditLogger";
import type { AuditLogEntry } from "@/types/case";

const ACTION_FILTERS = ["all", "approve", "decline", "escalate", "create_case", "case_status_change", "note_added", "bulk_action"] as const;

export function AuditLogPanel() {
  const { data: entries, isLoading } = useAuditLogQuery();
  const [filter, setFilter] = useState<(typeof ACTION_FILTERS)[number]>("all");

  const visible: AuditLogEntry[] = (entries ?? []).filter((e: AuditLogEntry) => filter === "all" || e.action === filter);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
        <ScrollText size={14} className="mr-1 text-ink-faint" aria-hidden="true" />
        {ACTION_FILTERS.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`rounded-full px-2.5 py-1 text-xs ${
              filter === a ? "bg-risk-info/15 text-risk-info" : "text-ink-faint hover:bg-surface-raised"
            }`}
          >
            {a.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && <p className="p-4 text-sm text-ink-faint">Loading audit trail…</p>}
        {!isLoading && visible.length === 0 && (
          <p className="p-4 text-sm text-ink-faint">No audit events yet — actions taken on alerts and cases will appear here, append-only.</p>
        )}
        <ul>
          {visible.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 border-b border-border px-4 py-2.5">
              <div>
                <p className="text-sm text-ink">{describeAuditEntry(entry)}</p>
                <p className="text-xs text-ink-faint">{entry.detail}</p>
              </div>
              <time className="shrink-0 whitespace-nowrap text-xs text-ink-faint">
                {formatAuditTimestamp(entry.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
