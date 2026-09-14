export type RiskTier = "critical" | "high" | "medium" | "low";

export type AlertStatus =
  | "new"
  | "approved"
  | "declined"
  | "escalated"
  | "case_created";

export interface Transaction {
  transactionId: string;
  customerId: string;
  timestamp: string;
  amount: number;
  currency: string;
  merchantCategory: string;
  country: string;
  isNewPayee: boolean;
  velocity1h: number;
  velocity24h: number;
  hourOfDay: number;
}

export interface CustomerSummary {
  customerId: string;
  name: string;
  accountAgeDays: number;
  priorDisputes: number;
  avgTransactionAmount: number;
}

export interface Alert {
  alertId: string;
  status: AlertStatus;
  riskScore: number;
  riskTier: RiskTier;
  isAnomaly: boolean;
  topSignals: string[];
  transaction: Transaction;
  customer: CustomerSummary;
  createdAt: string;
  caseId?: string;
}

export type AlertAction = "approve" | "decline" | "escalate" | "create_case";

export interface AlertActionRequest {
  alertId: string;
  action: AlertAction;
  note?: string;
}
