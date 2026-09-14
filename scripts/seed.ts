/**
 * Seed script: loads initial data from mock-data/alerts.json into SQLite.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql, eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

// Types from the existing alert structure
interface AlertJson {
  alertId: string;
  status: string;
  riskScore: number;
  riskTier: string;
  isAnomaly: boolean;
  topSignals: string[];
  transaction: {
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
  };
  customer: {
    customerId: string;
    name: string;
    accountAgeDays: number;
    priorDisputes: number;
    avgTransactionAmount: number;
  };
  createdAt: string;
}

function main() {
  console.log("Seeding database...");

  // Read the alerts JSON
  const alertsPath = join(__dirname, "..", "mock-data", "alerts.json");
  const alertsData: AlertJson[] = JSON.parse(readFileSync(alertsPath, "utf-8"));

  console.log(`Loaded ${alertsData.length} alerts from ${alertsPath}`);

  // Initialize SQLite database
  const dbPath = join(__dirname, "..", "db", "dev.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite, { schema });

  // Create tables if they don't exist
  console.log("Creating tables...");
  db.run(sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_age_days INTEGER NOT NULL,
      home_country TEXT NOT NULL DEFAULT 'US',
      prior_disputes INTEGER NOT NULL DEFAULT 0,
      avg_transaction_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      status TEXT NOT NULL DEFAULT 'new',
      risk_score REAL NOT NULL,
      risk_tier TEXT NOT NULL,
      is_anomaly INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      case_id TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES alerts(id),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      timestamp TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      merchant_category TEXT NOT NULL,
      country TEXT NOT NULL,
      is_new_payee INTEGER NOT NULL DEFAULT 0,
      velocity_1h INTEGER NOT NULL DEFAULT 0,
      velocity_24h INTEGER NOT NULL DEFAULT 0,
      hour_of_day INTEGER NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS model_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT NOT NULL REFERENCES alerts(id),
      raw_score REAL NOT NULL,
      signal_1 TEXT,
      signal_2 TEXT,
      signal_3 TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES alerts(id),
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'opened',
      priority TEXT NOT NULL DEFAULT 'standard',
      assigned_analyst TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS case_state_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT NOT NULL REFERENCES cases(id),
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS investigation_notes (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id),
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      step TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      detail TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clear existing data (for re-seeding)
  console.log("Clearing existing data...");
  db.run(sql`DELETE FROM model_scores`);
  db.run(sql`DELETE FROM transactions`);
  db.run(sql`DELETE FROM investigation_notes`);
  db.run(sql`DELETE FROM case_state_transitions`);
  db.run(sql`DELETE FROM cases`);
  db.run(sql`DELETE FROM audit_log`);
  db.run(sql`DELETE FROM alerts`);
  db.run(sql`DELETE FROM customers`);

  // Deduplicate customers
  const customerMap = new Map<string, AlertJson["customer"]>();
  for (const alert of alertsData) {
    if (!customerMap.has(alert.customer.customerId)) {
      customerMap.set(alert.customer.customerId, alert.customer);
    }
  }

  console.log(`Inserting ${customerMap.size} unique customers...`);

  // Insert customers
  for (const customer of customerMap.values()) {
    db.insert(schema.customers).values({
      id: customer.customerId,
      name: customer.name,
      accountAgeDays: customer.accountAgeDays,
      homeCountry: "US",
      priorDisputes: customer.priorDisputes,
      avgTransactionAmount: customer.avgTransactionAmount,
    }).run();
  }

  console.log(`Inserting ${alertsData.length} alerts with transactions and model scores...`);

  // Insert alerts, transactions, and model scores
  for (const alert of alertsData) {
    // Insert alert
    db.insert(schema.alerts).values({
      id: alert.alertId,
      customerId: alert.customer.customerId,
      status: alert.status,
      riskScore: alert.riskScore,
      riskTier: alert.riskTier,
      isAnomaly: alert.isAnomaly,
      createdAt: alert.createdAt,
    }).run();

    // Insert transaction
    db.insert(schema.transactions).values({
      id: alert.transaction.transactionId,
      alertId: alert.alertId,
      customerId: alert.customer.customerId,
      timestamp: alert.transaction.timestamp,
      amount: alert.transaction.amount,
      currency: alert.transaction.currency,
      merchantCategory: alert.transaction.merchantCategory,
      country: alert.transaction.country,
      isNewPayee: alert.transaction.isNewPayee,
      velocity1h: alert.transaction.velocity1h,
      velocity24h: alert.transaction.velocity24h,
      hourOfDay: alert.transaction.hourOfDay,
    }).run();

    // Insert model score (top signals)
    const signals = alert.topSignals;
    db.insert(schema.modelScores).values({
      alertId: alert.alertId,
      rawScore: alert.riskScore,
      signal1: signals[0] || null,
      signal2: signals[1] || null,
      signal3: signals[2] || null,
    }).run();
  }

  // Get counts
  const customerCount = db.select({ count: sql<number>`count(*)` }).from(schema.customers).get();
  const alertCount = db.select({ count: sql<number>`count(*)` }).from(schema.alerts).get();
  const transactionCount = db.select({ count: sql<number>`count(*)` }).from(schema.transactions).get();
  const modelScoreCount = db.select({ count: sql<number>`count(*)` }).from(schema.modelScores).get();

  console.log("Seeding complete!");
  console.log(`  Customers: ${customerCount?.count}`);
  console.log(`  Alerts: ${alertCount?.count}`);
  console.log(`  Transactions: ${transactionCount?.count}`);
  console.log(`  Model scores: ${modelScoreCount?.count}`);

  sqlite.close();
}

main();