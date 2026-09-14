"use client";

import type { Alert } from "@/types/alert";
import { RISK_TIER_LABEL } from "@/lib/riskScoring";

interface RiskGaugeCardProps {
  alert: Alert;
}

const TIER_HEX: Record<Alert["riskTier"], string> = {
  critical: "#E5484D",
  high: "#E5484D",
  medium: "#F5A623",
  low: "#3DDB8C",
};

/** Semicircular arc gauge, 0–100, needle-free (an arc fill reads faster
 *  than a needle at a glance, which matters when you're triaging fast). */
function GaugeArc({ score, color }: { score: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const filled = (clamped / 100) * circumference;

  return (
    <svg viewBox="0 0 180 100" className="w-full max-w-[220px]" role="img" aria-hidden="true">
      <path
        d="M 20 90 A 70 70 0 0 1 160 90"
        fill="none"
        stroke="#262E39"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M 20 90 A 70 70 0 0 1 160 90"
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
      />
      <text x="90" y="78" textAnchor="middle" className="fill-ink" style={{ fontSize: 28, fontWeight: 600 }}>
        {clamped.toFixed(0)}
      </text>
    </svg>
  );
}

export function RiskGaugeCard({ alert }: RiskGaugeCardProps) {
  const color = TIER_HEX[alert.riskTier];

  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="flex items-center gap-4">
        <GaugeArc score={alert.riskScore} color={color} />
        <div>
          <p className="text-sm font-medium text-ink" style={{ color }}>
            {RISK_TIER_LABEL[alert.riskTier]}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Score out of 100 · scikit-learn IsolationForest
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {alert.topSignals.map((signal, i) => (
          <div key={i} className="rounded border border-border bg-surface-raised px-3 py-2">
            <p className="text-xs text-ink">{signal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
