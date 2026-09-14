"use client";

import { useEffect, useState } from "react";
import ManualTestForm from "@/components/ManualTestForm";
import { ML_HEALTH_URL } from "@/lib/mlScore";

interface BackendStats {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  pendingAlerts: number;
  totalCases: number;
  totalCustomers: number;
}

export default function TestPage() {
  const [stats, setStats] = useState<BackendStats | null>(null);
  const [backendStatus, setBackendStatus] = useState<"loading" | "online" | "offline">("loading");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const remote = await fetch(ML_HEALTH_URL);
        if (remote.ok) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
        try {
          const statsResponse = await fetch("http://localhost:3001/api/stats");
          if (statsResponse.ok) {
            const data = await statsResponse.json();
            setStats(data);
          }
        } catch {
          // Local Express stats are optional when only Render LightGBM is up.
        }
      } catch {
        setBackendStatus("offline");
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <p className="lesson-banner__kicker">What you are looking at</p>
        <h1 className="lesson-banner__title" style={{ padding: 0 }}>
          Practice lab
        </h1>
        <p className="text-ink-muted mb-6 max-w-2xl">
          Type a pretend payment. The computer returns a risk number. This is how you learn what “high
          risk” feels like without touching real money.
        </p>

        {/* Backend Status */}
        <div className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${backendStatus === "online" ? "bg-risk-low" : backendStatus === "loading" ? "bg-risk-medium" : "bg-risk-critical"}`} />
              <span className="font-medium text-ink">
                LightGBM on Render: {backendStatus === "online" ? "Online" : backendStatus === "loading" ? "Checking..." : "Sleeping or offline"}
              </span>
            </div>
            {backendStatus === "offline" && (
              <div className="text-sm text-ink-faint">
                Free Render apps sleep. Open{" "}
                <a className="underline" href="https://watch-desk-lgbm.onrender.com/health">
                  the health URL
                </a>{" "}
                once, wait ~30s, then score again.
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface rounded-lg p-4 border border-border">
              <p className="text-ink-faint text-sm">Total Alerts</p>
              <p className="text-2xl font-bold text-ink">{stats.totalAlerts.toLocaleString()}</p>
            </div>
            <div className="bg-risk-critical/10 rounded-lg p-4 border border-risk-critical/30">
              <p className="text-risk-critical text-sm">Critical</p>
              <p className="text-2xl font-bold text-risk-critical">{stats.criticalAlerts.toLocaleString()}</p>
            </div>
            <div className="bg-risk-high/10 rounded-lg p-4 border border-risk-high/30">
              <p className="text-risk-high text-sm">High Risk</p>
              <p className="text-2xl font-bold text-risk-high">{stats.highAlerts.toLocaleString()}</p>
            </div>
            <div className="bg-risk-medium/10 rounded-lg p-4 border border-risk-medium/30">
              <p className="text-risk-medium text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-risk-medium">{stats.pendingAlerts.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Manual Test Form */}
        <ManualTestForm />

        {/* Quick Scenarios */}
        <div className="mt-6 bg-surface rounded-lg p-6 border border-border">
          <h2 className="text-lg font-bold text-ink mb-4">📋 Quick Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const event = new CustomEvent('loadScenario', { detail: {
                  amount: "15000",
                  merchantCategory: "jewelry",
                  country: "NG",
                  isNewPayee: true,
                  velocity1h: 8,
                  velocity24h: 25,
                  hourOfDay: 2,
                  accountAgeDays: 15,
                  priorDisputes: 2,
                  avgTransactionAmount: 500,
                }});
                window.dispatchEvent(event);
              }}
              className="bg-risk-critical/10 hover:bg-risk-critical/20 border border-risk-critical/30 rounded-lg p-4 text-left transition-colors"
            >
              <p className="font-bold text-risk-critical">🚨 High Risk Scenario</p>
              <p className="text-sm text-ink-faint mt-1">
                Large amount, new account, high-risk country, unusual hours
              </p>
            </button>
            
            <button
              onClick={() => {
                const event = new CustomEvent('loadScenario', { detail: {
                  amount: "250",
                  merchantCategory: "grocery",
                  country: "US",
                  isNewPayee: false,
                  velocity1h: 1,
                  velocity24h: 3,
                  hourOfDay: 14,
                  accountAgeDays: 730,
                  priorDisputes: 0,
                  avgTransactionAmount: 150,
                }});
                window.dispatchEvent(event);
              }}
              className="bg-risk-low/10 hover:bg-risk-low/20 border border-risk-low/30 rounded-lg p-4 text-left transition-colors"
            >
              <p className="font-bold text-risk-low">✅ Low Risk Scenario</p>
              <p className="text-sm text-ink-faint mt-1">
                Small amount, established account, normal hours
              </p>
            </button>
            
            <button
              onClick={() => {
                const event = new CustomEvent('loadScenario', { detail: {
                  amount: "2500",
                  merchantCategory: "electronics",
                  country: "US",
                  isNewPayee: true,
                  velocity1h: 3,
                  velocity24h: 10,
                  hourOfDay: 20,
                  accountAgeDays: 60,
                  priorDisputes: 1,
                  avgTransactionAmount: 800,
                }});
                window.dispatchEvent(event);
              }}
              className="bg-risk-medium/10 hover:bg-risk-medium/20 border border-risk-medium/30 rounded-lg p-4 text-left transition-colors"
            >
              <p className="font-bold text-risk-medium">⚠️ Medium Risk Scenario</p>
              <p className="text-sm text-ink-faint mt-1">
                Moderate amount, new payee, some velocity
              </p>
            </button>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-6 bg-surface rounded-lg p-6 border border-border">
          <h2 className="text-lg font-bold text-ink mb-4">📚 API Endpoints</h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center">
              <span className="bg-risk-low/20 text-risk-low px-2 py-1 rounded mr-3">GET</span>
              <code className="text-ink">/api/alerts</code>
              <span className="text-ink-faint ml-3">- List all alerts</span>
            </div>
            <div className="flex items-center">
              <span className="bg-risk-low/20 text-risk-low px-2 py-1 rounded mr-3">GET</span>
              <code className="text-ink">/api/alerts/:id</code>
              <span className="text-ink-faint ml-3">- Get alert by ID</span>
            </div>
            <div className="flex items-center">
              <span className="bg-risk-info/20 text-risk-info px-2 py-1 rounded mr-3">POST</span>
              <code className="text-ink">https://watch-desk-lgbm.onrender.com/score</code>
              <span className="text-ink-faint ml-3">- LightGBM score</span>
            </div>
            <div className="flex items-center">
              <span className="bg-risk-low/20 text-risk-low px-2 py-1 rounded mr-3">GET</span>
              <code className="text-ink">/api/stats</code>
              <span className="text-ink-faint ml-3">- Dashboard statistics</span>
            </div>
            <div className="flex items-center">
              <span className="bg-risk-low/20 text-risk-low px-2 py-1 rounded mr-3">GET</span>
              <code className="text-ink">/api/health</code>
              <span className="text-ink-faint ml-3">- Health check</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
