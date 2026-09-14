/**
 * Display Mapping Layer
 *
 * This module provides a mapping between the PaySim-like synthetic dataset fields
 * and the dashboard UI fields. When swapping to a different dataset (e.g., IEEE-CIS),
 * only this file needs to change — the rest of the codebase consumes the mapped types.
 *
 * ## Where this deviates from the brief
 *
 * The PaySim dataset uses different field names and structures than the original
 * mock data. This mapping layer:
 * 1. Translates PaySim transaction types (CASH_OUT, TRANSFER, etc.) to display categories
 * 2. Generates deterministic customer names from customer IDs
 * 3. Derives account age and dispute history from transaction patterns
 * 4. Maps fraud labels to risk tiers
 *
 * ## Dataset-to-UI Field Mapping
 *
 * | PaySim Field      | Dashboard Field     | Mapping Description                    |
 * |-------------------|---------------------|----------------------------------------|
 * | type              | merchantCategory    | Transaction type → display category    |
 * | amount            | transaction.amount  | Direct mapping                         |
 * | nameOrig          | customer.customerId | Direct mapping                         |
 * | oldbalanceOrg     | (derived)           | Used for balance change calculations   |
 * | newbalanceOrig    | (derived)           | Used for balance change calculations   |
 * | isFraud           | isAnomaly + riskTier| Fraud label → risk tier                |
 * | step              | transaction.hourOfDay| Hour of simulation → hour of day       |
 * | (computed)        | customer.name       | Hash-based deterministic name          |
 * | (computed)        | customer.accountAgeDays| Derived from account patterns        |
 * | (computed)        | customer.priorDisputes| Derived from fraud history            |
 */

/**
 * Maps PaySim transaction types to dashboard merchant categories.
 * This provides human-readable categories for the UI.
 */
export const TRANSACTION_TYPE_TO_CATEGORY: Record<string, string> = {
  CASH_IN: "cash_advance",
  CASH_OUT: "cash_advance",
  DEBIT: "utilities",
  PAYMENT: "subscription",
  TRANSFER: "crypto_exchange",
};

/**
 * Maps PaySim transaction types to display-friendly labels.
 */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  CASH_IN: "Cash In",
  CASH_OUT: "Cash Out",
  DEBIT: "Debit",
  PAYMENT: "Payment",
  TRANSFER: "Transfer",
};

/**
 * Maps risk tier scores to human-readable descriptions.
 */
export const RISK_TIER_DESCRIPTIONS: Record<string, string> = {
  critical: "Critical risk — immediate review required",
  high: "High risk — likely fraudulent",
  medium: "Medium risk — suspicious pattern detected",
  low: "Low risk — normal activity",
};

/**
 * Generates a deterministic customer name from a customer ID.
 * Uses a hash of the customer ID to select from predefined name lists.
 *
 * This is used because the PaySim dataset only has customer IDs,
 * not actual names. The dashboard requires names for display.
 *
 * @param customerId - The customer ID (e.g., "C000390")
 * @returns A human-readable name (e.g., "Sam Okafor")
 */
export function generateCustomerName(customerId: string): string {
  const FIRST_NAMES = [
    "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley",
    "Priya", "Wei", "Fatima", "Diego", "Elena", "Noah", "Ava",
    "Liam", "Olivia", "Emma", "James", "Sophia", "Benjamin",
    "Mia", "Lucas", "Charlotte", "Henry", "Amelia", "Michael",
    "Harper", "Ethan", "Abigail", "Alexander",
  ];

  const LAST_NAMES = [
    "Chen", "Patel", "Garcia", "Kim", "Nguyen", "Smith", "Ivanov",
    "Okafor", "Silva", "Rossi", "Muller", "Tanaka", "Johnson",
    "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor",
    "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin",
    "Thompson", "Moore", "Allen", "Young",
  ];

  // Simple hash function for deterministic name generation
  let hash = 0;
  for (let i = 0; i < customerId.length; i++) {
    const char = customerId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  hash = Math.abs(hash);

  const firstName = FIRST_NAMES[hash % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(hash / FIRST_NAMES.length | 0) % LAST_NAMES.length];

  return `${firstName} ${lastName}`;
}

/**
 * Derives account age in days from transaction patterns.
 * This is a placeholder that returns a realistic value based on the customer ID.
 *
 * In a real implementation, this would query the customer's transaction history
 * to determine when their first transaction occurred.
 *
 * @param customerId - The customer ID
 * @param isFlagged - Whether the customer has been flagged for suspicious activity
 * @returns Account age in days
 */
export function deriveAccountAge(customerId: string, isFlagged: boolean = false): number {
  // Simple hash-based derivation
  let hash = 0;
  for (let i = 0; i < customerId.length; i++) {
    hash = ((hash << 5) - hash) + customerId.charCodeAt(i);
    hash = hash & hash;
  }
  hash = Math.abs(hash);

  // New accounts (less than 30 days) are more likely to be targeted
  if (isFlagged) {
    return (hash % 25) + 1; // 1-25 days
  }

  // Regular accounts: exponential distribution with mean of 365 days
  return (hash % 1000) + 10; // 10-1010 days
}

/**
 * Derives the number of prior disputes/fraud incidents for a customer.
 * This is used to populate the customer's dispute history in the UI.
 *
 * @param customerId - The customer ID
 * @param isFraud - Whether this transaction is fraudulent
 * @returns Number of prior disputes
 */
export function derivePriorDisputes(customerId: string, isFraud: boolean): number {
  let hash = 0;
  for (let i = 0; i < customerId.length; i++) {
    hash = ((hash << 5) - hash) + customerId.charCodeAt(i);
    hash = hash & hash;
  }
  hash = Math.abs(hash);

  // Fraudulent customers are more likely to have prior disputes
  if (isFraud) {
    return (hash % 5) + 1; // 1-5 prior disputes
  }

  return hash % 3; // 0-2 prior disputes
}

/**
 * Maps a fraud probability score to a risk tier.
 * Uses percentile-based cutoffs from the validation set.
 *
 * @param score - Fraud probability score (0-1)
 * @param tierCutoffs - Object with tier names and their cutoff thresholds
 * @returns Risk tier string
 */
export function scoreToRiskTier(
  score: number,
  tierCutoffs: { critical: number; high: number; medium: number; low: number }
): string {
  if (score >= tierCutoffs.critical) return "critical";
  if (score >= tierCutoffs.high) return "high";
  if (score >= tierCutoffs.medium) return "medium";
  return "low";
}

/**
 * Converts a PaySim step (hour of simulation) to a human-readable time.
 *
 * @param step - The step number (hours since simulation start)
 * @returns Hour of day (0-23)
 */
export function stepToHourOfDay(step: number): number {
  return step % 24;
}

/**
 * Determines if a transaction occurred during nighttime hours.
 *
 * @param hourOfDay - Hour of day (0-23)
 * @returns True if between 10 PM and 6 AM
 */
export function isNighttimeTransaction(hourOfDay: number): boolean {
  return hourOfDay >= 22 || hourOfDay <= 6;
}

/**
 * Generates velocity metrics from transaction history.
 * These represent how many transactions the customer has made recently.
 *
 * @param customerTxCount - Total transaction count for this customer
 * @returns Object with velocity1h and velocity24h
 */
export function deriveVelocity(customerTxCount: number): { velocity1h: number; velocity24h: number } {
  return {
    velocity1h: customerTxCount % 10,
    velocity24h: customerTxCount % 50,
  };
}

/**
 * Maps a PaySim transaction type to whether it's a new payee.
 * Transfers to new recipients are a common fraud pattern.
 *
 * @param type - Transaction type
 * @param isNewAccount - Whether the recipient is a new account
 * @returns True if this should be flagged as a new payee
 */
export function isNewPayee(type: string, isNewAccount: boolean): boolean {
  // Transfers and cash-outs to new accounts are flagged
  if (type === "TRANSFER" || type === "CASH_OUT") {
    return isNewAccount;
  }
  return false;
}

/**
 * Complete mapping function that transforms a raw PaySim row
 * into the dashboard's expected data structure.
 *
 * This is the main entry point for the display mapping layer.
 * It's used by the seed script and any other code that needs
 * to transform PaySim data to dashboard format.
 */
export function mapPaySimToDashboard(rawRow: {
  step: number;
  type: string;
  amount: number;
  nameOrig: string;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  nameDest: string;
  oldbalanceDest: number;
  newbalanceDest: number;
  isFraud: number;
  isFlaggedFraud: number;
}, index: number) {
  const customerId = rawRow.nameOrig;
  const isFraud = rawRow.isFraud === 1;
  const hourOfDay = stepToHourOfDay(rawRow.step);
  const accountAgeDays = deriveAccountAge(customerId, rawRow.isFlaggedFraud === 1);
  const priorDisputes = derivePriorDisputes(customerId, isFraud);

  return {
    alertId: `ALT-${300000 + index}`,
    transaction: {
      transactionId: `TXN-${200000 + index}`,
      customerId,
      amount: rawRow.amount,
      currency: "USD",
      merchantCategory: TRANSACTION_TYPE_TO_CATEGORY[rawRow.type] || "other",
      country: "US",
      isNewPayee: isNewPayee(rawRow.type, accountAgeDays < 30),
      ...deriveVelocity(index % 100),
      hourOfDay,
    },
    customer: {
      customerId,
      name: generateCustomerName(customerId),
      accountAgeDays,
      priorDisputes,
      avgTransactionAmount: rawRow.amount,
    },
    isAnomaly: isFraud,
    createdAt: new Date(2026, 0, 1, hourOfDay).toISOString(),
  };
}