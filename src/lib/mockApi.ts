import type { Alert, AlertAction, AlertStatus } from "@/types/alert";
import type { CaseRecord, CaseStatus, InvestigationLogEntry } from "@/types/case";
import {
  fetchAlertsAction,
  fetchAlertByIdAction,
  postAlertActionAction,
  fetchCasesAction,
  fetchCaseByIdAction,
  advanceCaseStatusAction,
  fetchInvestigationLogAction,
  addInvestigationLogEntryAction,
  fetchAuditLogAction,
  postBulkActionAction,
} from "@/app/actions";

/**
 * Client-side mock backend that now calls the Express backend API.
 * 
 * The Express backend (backend/server.js) provides:
 * - Efficient SQL queries with JOINs (instead of N+1 queries)
 * - Real-time scoring endpoint for manual testing
 * - Dashboard statistics
 */

const API_BASE = "http://localhost:3001";

const LATENCY = () => 150 + Math.random() * 200;
const delay = <T,>(value: T, ms = LATENCY()) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

// Sequence counter for generating IDs (for the realtime pool)
let seq = 240 + 1000;
const nextId = (prefix: string) => `${prefix}-${(seq++).toString(36).toUpperCase()}`;

// ---------------------------------------------------------------------------
// REST-shaped mock endpoints (backed by Express backend API)
// ---------------------------------------------------------------------------

export interface PaginatedAlerts {
  alerts: Alert[];
  total: number;
  hasMore: boolean;
}

export async function fetchAlerts(limit = 20, offset = 0): Promise<PaginatedAlerts> {
  try {
    const response = await fetch(`${API_BASE}/api/alerts?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error("Failed to fetch alerts");
    const data = await response.json();
    return { alerts: data.alerts, total: data.total, hasMore: data.hasMore };
  } catch (error) {
    console.warn("Express backend unavailable, falling back to Server Actions:", error);
    const alerts = await fetchAlertsAction();
    const page = alerts.slice(offset, offset + limit);
    return { alerts: page, total: alerts.length, hasMore: offset + limit < alerts.length };
  }
}

export async function fetchAlertById(alertId: string): Promise<Alert | null> {
  try {
    const response = await fetch(`${API_BASE}/api/alerts/${alertId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Express backend unavailable, falling back to Server Actions:", error);
    return fetchAlertByIdAction(alertId) as Promise<Alert | null>;
  }
}

const ACTION_TO_STATUS: Record<AlertAction, AlertStatus> = {
  approve: "approved",
  decline: "declined",
  escalate: "escalated",
  create_case: "case_created",
};

export async function postAlertAction(alertId: string, action: AlertAction, note?: string) {
  const result = await postAlertActionAction(alertId, action, note);
  return delay(result);
}

export async function fetchCases(): Promise<CaseRecord[]> {
  const cases = await fetchCasesAction();
  return delay(cases);
}

export async function fetchCaseById(caseId: string): Promise<CaseRecord | undefined> {
  const caseRecord = await fetchCaseByIdAction(caseId);
  return delay(caseRecord);
}

export async function advanceCaseStatus(caseId: string, to: CaseStatus) {
  const caseRecord = await advanceCaseStatusAction(caseId, to);
  return delay(caseRecord);
}

export const NEXT_STATUS: Record<CaseStatus, CaseStatus | null> = {
  opened: "in_progress",
  in_progress: "resolved",
  escalated: "in_progress",
  resolved: "closed",
  closed: null,
};

export async function fetchInvestigationLog(caseId: string): Promise<InvestigationLogEntry[]> {
  const log = await fetchInvestigationLogAction(caseId);
  return delay(log);
}

export async function addInvestigationLogEntry(caseId: string, body: string, step: string | null) {
  const entry = await addInvestigationLogEntryAction(caseId, body, step);
  return delay(entry, 150);
}

export async function fetchAuditLog() {
  const log = await fetchAuditLogAction();
  return delay(log);
}

export async function postBulkAction(alertIds: string[], action: AlertAction) {
  const result = await postBulkActionAction(alertIds, action);
  return delay(result);
}

// ---------------------------------------------------------------------------
// Simulated realtime push (stand-in for the WebSocket/Socket.io mock)
// ---------------------------------------------------------------------------

type NewAlertListener = (alert: Alert) => void;
const listeners = new Set<NewAlertListener>();
let realtimeTimer: ReturnType<typeof setInterval> | null = null;
let poolIndex = 0;

// A held-back pool of "future" alerts the live feed drips in over time, so
// the demo has genuinely new rows to animate in rather than looping the
// same handful. Pulled from the tail of the scored dataset (lower-signal
// alerts), leaving the initial queue seeded with the higher-risk ones.
let REALTIME_POOL: Alert[] = [];
let poolLoaded = false;

async function loadRealtimePool() {
  if (poolLoaded) return;
  
  // Load only what we need for the realtime feed (40 alerts, offset to tail)
  try {
    const response = await fetch(`${API_BASE}/api/alerts?limit=40&offset=0`);
    if (response.ok) {
      const data = await response.json();
      REALTIME_POOL = data.alerts;
    } else {
      throw new Error("Backend unavailable");
    }
  } catch (error) {
    console.warn("Express backend unavailable for pool, falling back to Server Actions:", error);
    const allAlerts = await fetchAlertsAction();
    REALTIME_POOL = allAlerts.slice(0, 40);
  }
  
  poolLoaded = true;
}

export async function subscribeToNewAlerts(listener: NewAlertListener): Promise<() => void> {
  // Load the pool if not already loaded
  await loadRealtimePool();

  listeners.add(listener);
  if (!realtimeTimer) {
    realtimeTimer = setInterval(() => {
      if (poolIndex >= REALTIME_POOL.length) {
        poolIndex = 0; // loop the pool for long demo sessions
      }
      const incoming: Alert = {
        ...REALTIME_POOL[poolIndex++],
        alertId: nextId("ALT"),
        createdAt: new Date().toISOString(),
      };
      listeners.forEach((l) => l(incoming));
    }, 9000 + Math.random() * 6000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && realtimeTimer) {
      clearInterval(realtimeTimer);
      realtimeTimer = null;
    }
  };
}