"use client";

import { Check, Ban, ArrowUpCircle, X } from "lucide-react";
import type { AlertAction } from "@/types/alert";

interface BulkActionsBarProps {
  count: number;
  onAction: (action: AlertAction) => void;
  onClear: () => void;
  isPending: boolean;
}

export function BulkActionsBar({ count, onAction, onClear, isPending }: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label={`Bulk actions for ${count} selected alerts`}
      className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between border-t border-border-strong bg-surface-raised px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.35)]"
    >
      <p className="text-sm text-ink">
        <span className="font-mono">{count}</span> alert{count === 1 ? "" : "s"} selected
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAction("approve")}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded border border-risk-low/40 px-3 py-1.5 text-sm text-risk-low hover:bg-risk-low/10 disabled:opacity-50"
        >
          <Check size={14} /> Approve all
        </button>
        <button
          onClick={() => onAction("decline")}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded border border-risk-critical/40 px-3 py-1.5 text-sm text-risk-critical hover:bg-risk-critical/10 disabled:opacity-50"
        >
          <Ban size={14} /> Decline all
        </button>
        <button
          onClick={() => onAction("escalate")}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded border border-risk-medium/40 px-3 py-1.5 text-sm text-risk-medium hover:bg-risk-medium/10 disabled:opacity-50"
        >
          <ArrowUpCircle size={14} /> Escalate all
        </button>
        <button
          onClick={onClear}
          aria-label="Clear selection"
          className="rounded p-1.5 text-ink-faint hover:bg-surface hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
