"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import type { Alert, AlertAction, AlertStatus, Transaction, CustomerSummary } from "@/types/alert";
import type { CaseRecord, CaseStatus, InvestigationLogEntry } from "@/types/case";

// Sequence counter for generating IDs
let seq = 240 + 1000;
const nextId = (prefix: string) => `${prefix}-${(seq++).toString(36).toUpperCase()}`;

const CURRENT_ANALYST = "A. Reyes";

// Transform helpers: database rows -> frontend types
function dbAlertToAlert(
  dbAlert: typeof schema.alerts.$inferSelect,
  dbTransaction: typeof schema.transactions.$inferSelect,
  dbCustomer: typeof schema.customers.$inferSelect,
  dbModelScore?: typeof schema.modelScores.$inferSelect
): Alert {
  const transaction: Transaction = {
    transactionId: dbTransaction.id,
    customerId: dbTransaction.customerId,
    timestamp: dbTransaction.timestamp,
    amount: dbTransaction.amount,
    currency: dbTransaction.currency,
    merchantCategory: dbTransaction.merchantCategory,
    country: dbTransaction.country,
    isNewPayee: dbTransaction.isNewPayee,
    velocity1h: dbTransaction.velocity1h,
    velocity24h: dbTransaction.velocity24h,
    hourOfDay: dbTransaction.hourOfDay,
  };

  const customer: CustomerSummary = {
    customerId: dbCustomer.id,
    name: dbCustomer.name,
    accountAgeDays: dbCustomer.accountAgeDays,
    priorDisputes: dbCustomer.priorDisputes,
    avgTransactionAmount: dbCustomer.avgTransactionAmount,
  };

  const topSignals: string[] = [];
  if (dbModelScore?.signal1) topSignals.push(dbModelScore.signal1);
  if (dbModelScore?.signal2) topSignals.push(dbModelScore.signal2);
  if (dbModelScore?.signal3) topSignals.push(dbModelScore.signal3);
  if (topSignals.length === 0) topSignals.push("No single signal dominates — flagged on combined pattern");

  return {
    alertId: dbAlert.id,
    status: dbAlert.status as AlertStatus,
    riskScore: dbAlert.riskScore,
    riskTier: dbAlert.riskTier as Alert["riskTier"],
    isAnomaly: dbAlert.isAnomaly,
    topSignals,
    transaction,
    customer,
    createdAt: dbAlert.createdAt,
    caseId: dbAlert.caseId || undefined,
  };
}

function dbCaseToCaseRecord(dbCase: typeof schema.cases.$inferSelect): CaseRecord {
  return {
    caseId: dbCase.id,
    alertId: dbCase.alertId,
    title: dbCase.title,
    status: dbCase.status as CaseStatus,
    priority: dbCase.priority as CaseRecord["priority"],
    assignedAnalyst: dbCase.assignedAnalyst,
    createdAt: dbCase.createdAt,
    updatedAt: dbCase.updatedAt,
  };
}

function dbNoteToInvestigationLogEntry(
  dbNote: typeof schema.investigationNotes.$inferSelect
): InvestigationLogEntry {
  return {
    id: dbNote.id,
    caseId: dbNote.caseId,
    author: dbNote.author,
    body: dbNote.body,
    step: dbNote.step,
    createdAt: dbNote.createdAt,
  };
}

// Server Actions
export async function fetchAlertsAction(): Promise<Alert[]> {
  const db = await getDb();

  // Fetch all alerts with their related data
  const alertsRows = await db.select().from(schema.alerts).all();

  const alerts: Alert[] = [];
  for (const alertRow of alertsRows) {
    // Fetch related transaction
    const transactionRow = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.alertId, alertRow.id))
      .get();

    // Fetch related customer
    const customerRow = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, alertRow.customerId))
      .get();

    // Fetch model score
    const modelScoreRow = await db
      .select()
      .from(schema.modelScores)
      .where(eq(schema.modelScores.alertId, alertRow.id))
      .get();

    if (transactionRow && customerRow) {
      alerts.push(dbAlertToAlert(alertRow, transactionRow, customerRow, modelScoreRow));
    }
  }

  // Sort by risk score descending (like the original)
  alerts.sort((a, b) => b.riskScore - a.riskScore);

  return alerts;
}

export async function fetchAlertByIdAction(alertId: string): Promise<Alert | null> {
  const db = await getDb();

  const alertRow = await db
    .select()
    .from(schema.alerts)
    .where(eq(schema.alerts.id, alertId))
    .get();

  if (!alertRow) return null;

  const transactionRow = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.alertId, alertId))
    .get();

  const customerRow = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, alertRow.customerId))
    .get();

  const modelScoreRow = await db
    .select()
    .from(schema.modelScores)
    .where(eq(schema.modelScores.alertId, alertId))
    .get();

  if (!transactionRow || !customerRow) return null;

  return dbAlertToAlert(alertRow, transactionRow, customerRow, modelScoreRow);
}

const ACTION_TO_STATUS: Record<AlertAction, AlertStatus> = {
  approve: "approved",
  decline: "declined",
  escalate: "escalated",
  create_case: "case_created",
};

export async function postAlertActionAction(
  alertId: string,
  action: AlertAction,
  note?: string
): Promise<{ alert: Alert; case?: CaseRecord }> {
  const db = await getDb();

  // Fetch the alert
  const alertRow = await db
    .select()
    .from(schema.alerts)
    .where(eq(schema.alerts.id, alertId))
    .get();

  if (!alertRow) throw new Error(`Unknown alert ${alertId}`);

  // Simulate an occasional server-side rejection
  if (Math.random() < 0.06) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error("The mock API rejected this action (simulated conflict). Try again.");
  }

  // Update alert status
  const newStatus = ACTION_TO_STATUS[action];
  await db
    .update(schema.alerts)
    .set({ status: newStatus })
    .where(eq(schema.alerts.id, alertId));

  // Write audit log
  await writeAudit(action, "alert", alertId, note ? `${action} — "${note}"` : action);

  let createdCase: CaseRecord | undefined;
  if (action === "escalate" || action === "create_case") {
    // Fetch related data for case title
    const customerRow = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, alertRow.customerId))
      .get();

    const transactionRow = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.alertId, alertId))
      .get();

    const caseId = nextId("CASE");
    const now = new Date().toISOString();

    // Create case
    await db.insert(schema.cases).values({
      id: caseId,
      alertId,
      title: `${customerRow?.name || "Unknown"} — ${transactionRow?.merchantCategory.replace("_", " ") || "Unknown"} (${alertRow.riskTier})`,
      status: action === "escalate" ? "escalated" : "opened",
      priority: alertRow.riskTier === "critical" ? "critical" : alertRow.riskTier === "high" ? "high" : "standard",
      assignedAnalyst: CURRENT_ANALYST,
      createdAt: now,
      updatedAt: now,
    });

    // Update alert with case ID
    await db
      .update(schema.alerts)
      .set({ caseId })
      .where(eq(schema.alerts.id, alertId));

    // Write case audit
    await writeAudit(
      "case_status_change",
      "case",
      caseId,
      `Case opened from ${alertId} (${action === "escalate" ? "escalated" : "opened"})`
    );

    createdCase = {
      caseId,
      alertId,
      title: `${customerRow?.name || "Unknown"} — ${transactionRow?.merchantCategory.replace("_", " ") || "Unknown"} (${alertRow.riskTier})`,
      status: action === "escalate" ? "escalated" : "opened",
      priority: alertRow.riskTier === "critical" ? "critical" : alertRow.riskTier === "high" ? "high" : "standard",
      assignedAnalyst: CURRENT_ANALYST,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Fetch updated alert
  const updatedAlertRow = await db
    .select()
    .from(schema.alerts)
    .where(eq(schema.alerts.id, alertId))
    .get();

  const transactionRow = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.alertId, alertId))
    .get();

  const customerRow = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, alertRow.customerId))
    .get();

  const modelScoreRow = await db
    .select()
    .from(schema.modelScores)
    .where(eq(schema.modelScores.alertId, alertId))
    .get();

  const alert = dbAlertToAlert(updatedAlertRow!, transactionRow!, customerRow!, modelScoreRow);

  return { alert, case: createdCase };
}

export async function fetchCasesAction(): Promise<CaseRecord[]> {
  const db = await getDb();
  const casesRows = await db.select().from(schema.cases).all();
  return casesRows.map(dbCaseToCaseRecord);
}

export async function fetchCaseByIdAction(caseId: string): Promise<CaseRecord | undefined> {
  const db = await getDb();
  const caseRow = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .get();

  return caseRow ? dbCaseToCaseRecord(caseRow) : undefined;
}

const NEXT_STATUS: Record<CaseStatus, CaseStatus | null> = {
  opened: "in_progress",
  in_progress: "resolved",
  escalated: "in_progress",
  resolved: "closed",
  closed: null,
};

export async function advanceCaseStatusAction(caseId: string, to: CaseStatus): Promise<CaseRecord> {
  const db = await getDb();

  const caseRow = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .get();

  if (!caseRow) throw new Error(`Unknown case ${caseId}`);

  const from = caseRow.status;
  const now = new Date().toISOString();

  // Update case status
  await db
    .update(schema.cases)
    .set({ status: to, updatedAt: now })
    .where(eq(schema.cases.id, caseId));

  // Record state transition
  await db.insert(schema.caseStateTransitions).values({
    caseId,
    fromStatus: from,
    toStatus: to,
    actor: CURRENT_ANALYST,
    createdAt: now,
  });

  // Write audit log
  await writeAudit("case_status_change", "case", caseId, `${from} → ${to}`);

  // Fetch updated case
  const updatedCaseRow = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .get();

  return dbCaseToCaseRecord(updatedCaseRow!);
}

// NEXT_STATUS is defined in mockApi.ts (not a server action)

export async function fetchInvestigationLogAction(caseId: string): Promise<InvestigationLogEntry[]> {
  const db = await getDb();
  const notesRows = await db
    .select()
    .from(schema.investigationNotes)
    .where(eq(schema.investigationNotes.caseId, caseId))
    .all();

  return notesRows.map(dbNoteToInvestigationLogEntry);
}

export async function addInvestigationLogEntryAction(
  caseId: string,
  body: string,
  step: string | null
): Promise<InvestigationLogEntry> {
  const db = await getDb();
  const id = nextId("LOG");
  const now = new Date().toISOString();

  // Insert note
  await db.insert(schema.investigationNotes).values({
    id,
    caseId,
    author: CURRENT_ANALYST,
    body,
    step,
    createdAt: now,
  });

  // Write audit log
  await writeAudit("note_added", "case", caseId, step ? `Note added (${step})` : "Note added");

  // Return the created entry
  return {
    id,
    caseId,
    author: CURRENT_ANALYST,
    body,
    step,
    createdAt: now,
  };
}

export async function fetchAuditLogAction() {
  const db = await getDb();
  const auditRows = await db.select().from(schema.auditLog).all();

  // Transform to match the expected type
  return auditRows.map((row: typeof schema.auditLog.$inferSelect) => ({
    id: row.id,
    actor: row.actor,
    action: row.action,
    targetType: row.targetType as "alert" | "case",
    targetId: row.targetId,
    detail: row.detail,
    timestamp: row.timestamp,
  }));
}

export async function postBulkActionAction(alertIds: string[], action: AlertAction) {
  const db = await getDb();
  const results: string[] = [];

  const newStatus = ACTION_TO_STATUS[action];

  for (const id of alertIds) {
    // Check if alert exists
    const alertRow = await db
      .select()
      .from(schema.alerts)
      .where(eq(schema.alerts.id, id))
      .get();

    if (!alertRow) continue;

    // Update status
    await db
      .update(schema.alerts)
      .set({ status: newStatus })
      .where(eq(schema.alerts.id, id));

    results.push(id);
  }

  // Write audit log
  await writeAudit("bulk_action", "alert", alertIds.join(","), `${action} on ${alertIds.length} alerts`);

  return { affected: results };
}

// Helper function for audit logging
async function writeAudit(
  action: string,
  targetType: "alert" | "case",
  targetId: string,
  detail: string
) {
  const db = await getDb();
  const id = nextId("AUD");
  const timestamp = new Date().toISOString();

  await db.insert(schema.auditLog).values({
    id,
    actor: CURRENT_ANALYST,
    action,
    targetType,
    targetId,
    detail,
    timestamp,
  });
}