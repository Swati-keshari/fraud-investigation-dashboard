import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Connect to the existing SQLite database
const db = new Database(join(__dirname, '..', 'db', 'dev.db'));
db.pragma('journal_mode = WAL');

// Cache prepared statements at module level to prevent garbage collection crash
const ALERT_COLUMNS = `
  a.id as alertId, a.status, a.risk_score as riskScore, a.risk_tier as riskTier,
  a.is_anomaly as isAnomaly, a.created_at as createdAt, a.case_id as caseId,
  t.id as transactionId, t.customer_id as customerId, t.timestamp, t.amount,
  t.currency, t.merchant_category as merchantCategory, t.country,
  t.is_new_payee as isNewPayee, t.velocity_1h as velocity1h,
  t.velocity_24h as velocity24h, t.hour_of_day as hourOfDay,
  c.name as customerName, c.account_age_days as accountAgeDays,
  c.prior_disputes as priorDisputes, c.avg_transaction_amount as avgTransactionAmount,
  ms.signal_1 as signal1, ms.signal_2 as signal2, ms.signal_3 as signal3
`;

const JOIN_CLAUSE = `
  FROM alerts a
  JOIN transactions t ON a.id = t.alert_id
  JOIN customers c ON a.customer_id = c.id
  LEFT JOIN model_scores ms ON a.id = ms.alert_id
`;

// Prepared statements for each risk tier (cached to prevent GC crash)
const stmtCritical = db.prepare(`SELECT ${ALERT_COLUMNS} ${JOIN_CLAUSE} WHERE a.risk_tier = 'critical' AND a.status = 'new' ORDER BY a.risk_score DESC LIMIT ?`);
const stmtHigh = db.prepare(`SELECT ${ALERT_COLUMNS} ${JOIN_CLAUSE} WHERE a.risk_tier = 'high' AND a.status = 'new' ORDER BY a.risk_score DESC LIMIT ?`);
const stmtMedium = db.prepare(`SELECT ${ALERT_COLUMNS} ${JOIN_CLAUSE} WHERE a.risk_tier = 'medium' AND a.status = 'new' ORDER BY a.risk_score DESC LIMIT ?`);
const stmtLow = db.prepare(`SELECT ${ALERT_COLUMNS} ${JOIN_CLAUSE} WHERE a.risk_tier = 'low' AND a.status = 'new' ORDER BY a.risk_score DESC LIMIT ?`);
const stmtByTier = db.prepare(`SELECT ${ALERT_COLUMNS} ${JOIN_CLAUSE} WHERE a.risk_tier = ? AND a.status = 'new' ORDER BY a.risk_score DESC LIMIT ? OFFSET ?`);
const stmtAlertById = db.prepare(`SELECT ${ALERT_COLUMNS} ${JOIN_CLAUSE} WHERE a.id = ?`);
const stmtCountAll = db.prepare(`SELECT COUNT(*) as total FROM alerts a WHERE a.status = 'new'`);
const stmtCountByTier = db.prepare(`SELECT COUNT(*) as total FROM alerts a WHERE a.risk_tier = ? AND a.status = 'new'`);
const stmtPaginated = db.prepare(`SELECT ${ALERT_COLUMNS} ${JOIN_CLAUSE} WHERE a.status = 'new' ORDER BY a.risk_score DESC LIMIT ? OFFSET ?`);

// Transform helper: DB row -> Alert
function transformRow(row) {
  return {
    alertId: row.alertId,
    status: row.status,
    riskScore: row.riskScore,
    riskTier: row.riskTier,
    isAnomaly: Boolean(row.isAnomaly),
    topSignals: [row.signal1, row.signal2, row.signal3].filter(Boolean),
    transaction: {
      transactionId: row.transactionId,
      customerId: row.customerId,
      timestamp: row.timestamp,
      amount: row.amount,
      currency: row.currency,
      merchantCategory: row.merchantCategory,
      country: row.country,
      isNewPayee: Boolean(row.isNewPayee),
      velocity1h: row.velocity1h,
      velocity24h: row.velocity24h,
      hourOfDay: row.hourOfDay,
    },
    customer: {
      customerId: row.customerId,
      name: row.customerName,
      accountAgeDays: row.accountAgeDays,
      priorDisputes: row.priorDisputes,
      avgTransactionAmount: row.avgTransactionAmount,
    },
    createdAt: row.createdAt,
    caseId: row.caseId,
  };
}

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// Get alerts — on-demand paginated query, no data cached in RAM
app.get('/api/alerts', (req, res) => {
  try {
    const { riskTier, limit = 20, offset = 0 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    // Get total count for this filter
    const total = riskTier
      ? stmtCountByTier.get(riskTier).total
      : stmtCountAll.get().total;

    // On-demand query from SQLite (no caching)
    const rows = riskTier
      ? stmtByTier.all(riskTier, limitNum, offsetNum)
      : stmtPaginated.all(limitNum, offsetNum);

    const alerts = rows.map(transformRow);
    res.json({ alerts, total, hasMore: offsetNum + limitNum < total });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get alert by ID
app.get('/api/alerts/:id', (req, res) => {
  try {
    const row = stmtAlertById.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Alert not found' });
    res.json(transformRow(row));
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: error.message });
  }
});

// Score a single transaction
app.post('/api/score', (req, res) => {
  try {
    const {
      amount, merchantCategory, country, isNewPayee,
      velocity1h, velocity24h, hourOfDay,
      accountAgeDays, priorDisputes,
    } = req.body;

    let riskScore = 0;
    const signals = [];

    if (amount > 10000) { riskScore += 30; signals.push('High transaction amount'); }
    else if (amount > 5000) { riskScore += 15; signals.push('Elevated transaction amount'); }

    if (velocity1h > 5) { riskScore += 25; signals.push('High velocity (1h)'); }
    if (velocity24h > 20) { riskScore += 20; signals.push('High velocity (24h)'); }

    if (hourOfDay >= 23 || hourOfDay <= 5) { riskScore += 15; signals.push('Unusual transaction time'); }
    if (isNewPayee) { riskScore += 20; signals.push('New payee'); }
    if (accountAgeDays < 30) { riskScore += 20; signals.push('New account'); }
    else if (accountAgeDays < 90) { riskScore += 10; signals.push('Relatively new account'); }
    if (priorDisputes > 0) { riskScore += priorDisputes * 10; signals.push(`${priorDisputes} prior dispute(s)`); }

    const highRiskCountries = ['NG', 'GH', 'KE', 'ZA', 'EG'];
    if (highRiskCountries.includes(country)) { riskScore += 15; signals.push('High-risk country'); }

    riskScore = Math.min(riskScore / 100, 1);

    let riskTier;
    if (riskScore >= 0.7) riskTier = 'critical';
    else if (riskScore >= 0.4) riskTier = 'high';
    else if (riskScore >= 0.2) riskTier = 'medium';
    else riskTier = 'low';

    res.json({
      riskScore,
      riskTier,
      signals: signals.length > 0 ? signals : ['No significant risk signals'],
      recommendation: riskScore >= 0.7 ? 'Block and investigate' :
                     riskScore >= 0.4 ? 'Review manually' :
                     riskScore >= 0.2 ? 'Monitor closely' : 'Approve',
    });
  } catch (error) {
    console.error('Error scoring transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const count = (sql) => db.prepare(sql).get().count;
    res.json({
      totalAlerts: count('SELECT COUNT(*) as count FROM alerts'),
      criticalAlerts: count("SELECT COUNT(*) as count FROM alerts WHERE risk_tier = 'critical'"),
      highAlerts: count("SELECT COUNT(*) as count FROM alerts WHERE risk_tier = 'high'"),
      mediumAlerts: count("SELECT COUNT(*) as count FROM alerts WHERE risk_tier = 'medium'"),
      lowAlerts: count("SELECT COUNT(*) as count FROM alerts WHERE risk_tier = 'low'"),
      pendingAlerts: count("SELECT COUNT(*) as count FROM alerts WHERE status = 'new'"),
      totalCases: count('SELECT COUNT(*) as count FROM cases'),
      totalCustomers: count('SELECT COUNT(*) as count FROM customers'),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
