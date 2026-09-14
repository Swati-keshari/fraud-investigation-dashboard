import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(), // e.g. "CUS-10001"
  name: text("name").notNull(),
  accountAgeDays: integer("account_age_days").notNull(),
  homeCountry: text("home_country").notNull().default("US"),
  priorDisputes: integer("prior_disputes").notNull().default(0),
  avgTransactionAmount: real("avg_transaction_amount").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(), // e.g. "ALT-300001"
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  status: text("status").notNull().default("new"), // new | approved | declined | escalated | case_created
  riskScore: real("risk_score").notNull(),
  riskTier: text("risk_tier").notNull(), // critical | high | medium | low
  isAnomaly: integer("is_anomaly", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  caseId: text("case_id"), // nullable, set when escalated or case created
});

// ---------------------------------------------------------------------------
// Transactions (1:1 with alerts, kept separate for clean schema)
// ---------------------------------------------------------------------------
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(), // transactionId, e.g. "TXN-200001"
  alertId: text("alert_id")
    .notNull()
    .references(() => alerts.id),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  timestamp: text("timestamp").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  merchantCategory: text("merchant_category").notNull(),
  country: text("country").notNull(),
  isNewPayee: integer("is_new_payee", { mode: "boolean" }).notNull().default(false),
  velocity1h: integer("velocity_1h").notNull().default(0),
  velocity24h: integer("velocity_24h").notNull().default(0),
  hourOfDay: integer("hour_of_day").notNull(),
});

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(), // e.g. "CASE-ABC123"
  alertId: text("alert_id")
    .notNull()
    .references(() => alerts.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("opened"), // opened | in_progress | escalated | resolved | closed
  priority: text("priority").notNull().default("standard"), // standard | high | critical
  assignedAnalyst: text("assigned_analyst"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Case state transitions (append-only)
// ---------------------------------------------------------------------------
export const caseStateTransitions = sqliteTable("case_state_transitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  actor: text("actor").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Investigation notes
// ---------------------------------------------------------------------------
export const investigationNotes = sqliteTable("investigation_notes", {
  id: text("id").primaryKey(), // e.g. "LOG-XYZ789"
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id),
  author: text("author").notNull(),
  body: text("body").notNull(),
  step: text("step"), // nullable
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Audit log (append-only)
// ---------------------------------------------------------------------------
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(), // e.g. "AUD-DEF456"
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(), // alert | case
  targetId: text("target_id").notNull(),
  detail: text("detail").notNull(),
  timestamp: text("timestamp")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Analysts
// ---------------------------------------------------------------------------
export const analysts = sqliteTable("analysts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("analyst"), // analyst | admin
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Rules (detection rules, for Phase 4)
// ---------------------------------------------------------------------------
export const rules = sqliteTable("rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  condition: text("condition").notNull(), // JSON string of rule condition
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Model scores (raw score + top-3 signal labels per alert)
// ---------------------------------------------------------------------------
export const modelScores = sqliteTable("model_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  alertId: text("alert_id")
    .notNull()
    .references(() => alerts.id),
  rawScore: real("raw_score").notNull(),
  signal1: text("signal_1"),
  signal2: text("signal_2"),
  signal3: text("signal_3"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});