"use client";

import { Activity, Clock, History } from "lucide-react";
import type { Alert } from "@/types/alert";
import { formatCurrency } from "@/lib/riskScoring";

interface EvidenceTimelineProps {
  alert: Alert;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Activity;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // content-visibility: auto means these sections don't cost layout/paint
    // until the drawer scrolls them into view.
    <section style={{ contentVisibility: "auto" }} className="rounded border border-border bg-surface p-4">
      <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
        <Icon size={14} className="text-ink-faint" aria-hidden="true" />
        {title}
      </h3>
      <div className="mt-2 space-y-1.5 text-sm text-ink-muted">{children}</div>
    </section>
  );
}

export function EvidenceTimeline({ alert }: EvidenceTimelineProps) {
  const { transaction, customer } = alert;

  return (
    <div className="space-y-3">
      <Section icon={Activity} title="Anomaly patterns">
        <p>
          This transaction is{" "}
          <span className="font-mono text-ink">
            {(transaction.amount / Math.max(customer.avgTransactionAmount, 1)).toFixed(1)}×
          </span>{" "}
          the customer&rsquo;s average of {formatCurrency(customer.avgTransactionAmount)}.
        </p>
        {transaction.isNewPayee && <p>First transaction recorded with this payee.</p>}
        {alert.isAnomaly && (
          <p className="text-risk-medium">Flagged as a statistical outlier against this customer&rsquo;s baseline.</p>
        )}
      </Section>

      <Section icon={Clock} title="Velocity checks">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-ink-faint">Last hour</p>
            <p className="font-mono text-ink">{transaction.velocity1h} txns</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Last 24 hours</p>
            <p className="font-mono text-ink">{transaction.velocity24h} txns</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Hour of day</p>
            <p className="font-mono text-ink">{String(transaction.hourOfDay).padStart(2, "0")}:00</p>
          </div>
        </div>
      </Section>

      <Section icon={History} title="Customer history">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-faint">Account age</p>
            <p className="text-ink">{customer.accountAgeDays} days</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Prior disputes</p>
            <p className="text-ink">{customer.priorDisputes}</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Avg. transaction</p>
            <p className="text-ink">{formatCurrency(customer.avgTransactionAmount)}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
