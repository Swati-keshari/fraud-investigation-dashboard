import type { RiskTier } from "@/types/alert";

/**
 * Reads the precomputed scikit-learn risk scores (see ml-service/train_model.py
 * + mock-data/alerts.json) and maps them to the UI's visual/textual vocabulary.
 * Risk level is never color-only in this app — every call site pairs the
 * returned color with `label`.
 */

export const RISK_TIER_LABEL: Record<RiskTier, string> = {
  critical: "Critical risk",
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
};

export const RISK_TIER_COLOR_VAR: Record<RiskTier, string> = {
  critical: "var(--color-risk-critical, #E5484D)",
  high: "var(--color-risk-high, #E5484D)",
  medium: "var(--color-risk-medium, #F5A623)",
  low: "var(--color-risk-low, #3DD68C)",
};

export function tierFromScore(score: number): RiskTier {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
