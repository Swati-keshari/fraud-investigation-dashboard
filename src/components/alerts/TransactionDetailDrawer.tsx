"use client";

import { useEffect, useRef } from "react";
import { X, Check, Ban, ArrowUpCircle, FolderPlus } from "lucide-react";
import type { Alert, AlertAction } from "@/types/alert";
import { RiskGaugeCard } from "./RiskGaugeCard";
import { EvidenceTimeline } from "./EvidenceTimeline";
import { formatCurrency } from "@/lib/riskScoring";

interface TransactionDetailDrawerProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: AlertAction) => void;
  isActionPending: boolean;
}

const ACTIONS: { action: AlertAction; label: string; icon: typeof Check; shortcut: string; tone: string }[] = [
  { action: "approve", label: "Approve", icon: Check, shortcut: "A", tone: "text-risk-low border-risk-low/40 hover:bg-risk-low/10" },
  { action: "decline", label: "Decline", icon: Ban, shortcut: "D", tone: "text-risk-critical border-risk-critical/40 hover:bg-risk-critical/10" },
  { action: "escalate", label: "Escalate", icon: ArrowUpCircle, shortcut: "E", tone: "text-risk-medium border-risk-medium/40 hover:bg-risk-medium/10" },
  { action: "create_case", label: "Create case", icon: FolderPlus, shortcut: "C", tone: "text-risk-info border-risk-info/40 hover:bg-risk-info/10" },
];

export function TransactionDetailDrawer({
  alert,
  isOpen,
  onClose,
  onAction,
  isActionPending,
}: TransactionDetailDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native <dialog> gives us focus-trapping and Esc-to-close for free —
  // preferred over a hand-rolled modal per the a11y brief.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      // dialog's native Esc handling fires "cancel" then "close" — hook the
      // close through our own state so the drawer and the queue stay in sync.
      onClose();
    };
    dialog.addEventListener("close", handleCancel);
    return () => dialog.removeEventListener("close", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={alert ? `Transaction detail for ${alert.alertId}` : "Transaction detail"}
      className="fixed inset-y-0 right-0 m-0 h-full max-h-none w-full max-w-md border-l border-border-strong bg-canvas p-0 text-ink backdrop:bg-black/60 open:flex open:flex-col"
    >
      {alert && (
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-mono text-sm text-ink">{alert.alertId}</p>
              <p className="text-xs text-ink-faint">{alert.transaction.transactionId}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close (Esc)"
              className="rounded p-1.5 text-ink-faint hover:bg-surface hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div>
              <p className="text-lg font-medium text-ink">{alert.customer.name}</p>
              <p className="text-sm text-ink-muted">
                {formatCurrency(alert.transaction.amount)} · {alert.transaction.merchantCategory.replace("_", " ")} ·{" "}
                {alert.transaction.country}
              </p>
            </div>

            <RiskGaugeCard alert={alert} />
            <EvidenceTimeline alert={alert} />
          </div>

          <div className="shrink-0 border-t border-border p-3">
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map(({ action, label, icon: Icon, shortcut, tone }) => (
                <button
                  key={action}
                  onClick={() => onAction(action)}
                  disabled={isActionPending}
                  className={`flex items-center justify-between rounded border bg-transparent px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${tone}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon size={15} aria-hidden="true" />
                    {label}
                  </span>
                  <kbd className="rounded border border-current/30 px-1 text-[10px] opacity-70">{shortcut}</kbd>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
