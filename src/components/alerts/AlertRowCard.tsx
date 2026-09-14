"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import type { Alert } from "@/types/alert";
import { RISK_TIER_LABEL, formatCurrency } from "@/lib/riskScoring";

interface AlertRowCardProps {
  alert: Alert;
  onOpen: () => void;
  selected: boolean;
  onToggleSelected: () => void;
}

/**
 * Built as its own component using a container query (`@container` on the
 * list wrapper, `@sm:` variants here) rather than a viewport breakpoint, so
 * it renders correctly whether the queue is full-width or squeezed into a
 * split view alongside the drawer.
 */
export function AlertRowCard({ alert, onOpen, selected, onToggleSelected }: AlertRowCardProps) {
  const tier = alert.riskTier;

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 border-b border-border p-3 @sm:flex-row @sm:items-center @sm:justify-between",
        selected && "bg-risk-info/5"
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelected}
          aria-label={`Select alert ${alert.alertId}`}
          className="mt-1 h-4 w-4 shrink-0 accent-risk-info"
        />
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={clsx("h-2 w-2 shrink-0 rounded-full", {
                "bg-risk-critical": tier === "critical" || tier === "high",
                "bg-risk-medium": tier === "medium",
                "bg-risk-low": tier === "low",
              })}
            />
            <span className="font-mono text-sm text-ink">{alert.riskScore.toFixed(0)}</span>
            <span className="text-xs text-ink-faint">{RISK_TIER_LABEL[tier]}</span>
          </div>
          <p className="mt-1 truncate text-sm text-ink">{alert.customer.name}</p>
          <p className="truncate text-xs text-ink-muted">
            {formatCurrency(alert.transaction.amount)} · {alert.transaction.merchantCategory.replace("_", " ")} ·{" "}
            {alert.transaction.country}
          </p>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 pl-7 @sm:pl-0 @sm:min-w-[7rem] @sm:justify-end">
        {alert.status === "new" ? (
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <AlertTriangle size={12} aria-hidden="true" /> New
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-risk-low">
            <ShieldCheck size={12} aria-hidden="true" /> Reviewed
          </span>
        )}
      </div>
    </div>
  );
}
