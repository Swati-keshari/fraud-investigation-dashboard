"use client";

import { useState } from "react";
import { ML_SCORE_URL } from "@/lib/mlScore";

interface ScoreResult {
  riskScore: number;
  riskTier: string;
  signals: string[];
  recommendation: string;
}

export default function ManualTestForm() {
  const [formData, setFormData] = useState({
    amount: "500",
    merchantCategory: "electronics",
    country: "US",
    isNewPayee: false,
    velocity1h: 1,
    velocity24h: 3,
    hourOfDay: 14,
    accountAgeDays: 365,
    priorDisputes: 0,
    avgTransactionAmount: 200,
  });

  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : 
               type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(ML_SCORE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to score transaction");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case "critical": return "bg-red-600";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <h2 className="text-lg font-bold text-ink mb-4">🔍 Manual Transaction Test</h2>
      <p className="text-ink-faint text-sm mb-6">
        Enter transaction details to test the fraud scoring system in real-time.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Transaction Amount ($)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
            required
          />
        </div>

        {/* Merchant Category */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Merchant Category
          </label>
          <select
            name="merchantCategory"
            value={formData.merchantCategory}
            onChange={handleChange}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
          >
            <option value="electronics">Electronics</option>
            <option value="jewelry">Jewelry</option>
            <option value="gas_station">Gas Station</option>
            <option value="grocery">Grocery</option>
            <option value="restaurant">Restaurant</option>
            <option value="travel">Travel</option>
            <option value="online_retail">Online Retail</option>
            <option value="cash_advance">Cash Advance</option>
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Country
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
          >
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="NG">Nigeria (High Risk)</option>
            <option value="GH">Ghana (High Risk)</option>
            <option value="KE">Kenya (High Risk)</option>
            <option value="ZA">South Africa</option>
            <option value="IN">India</option>
            <option value="BR">Brazil</option>
          </select>
        </div>

        {/* Hour of Day */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Hour of Day (0-23)
          </label>
          <input
            type="number"
            name="hourOfDay"
            value={formData.hourOfDay}
            onChange={handleChange}
            min="0"
            max="23"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
            required
          />
        </div>

        {/* Velocity 1h */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Transactions (1h)
          </label>
          <input
            type="number"
            name="velocity1h"
            value={formData.velocity1h}
            onChange={handleChange}
            min="0"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
            required
          />
        </div>

        {/* Velocity 24h */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Transactions (24h)
          </label>
          <input
            type="number"
            name="velocity24h"
            value={formData.velocity24h}
            onChange={handleChange}
            min="0"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
            required
          />
        </div>

        {/* Account Age */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Account Age (days)
          </label>
          <input
            type="number"
            name="accountAgeDays"
            value={formData.accountAgeDays}
            onChange={handleChange}
            min="0"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
            required
          />
        </div>

        {/* Prior Disputes */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Prior Disputes
          </label>
          <input
            type="number"
            name="priorDisputes"
            value={formData.priorDisputes}
            onChange={handleChange}
            min="0"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
            required
          />
        </div>

        {/* Avg Transaction Amount */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Avg Transaction Amount ($)
          </label>
          <input
            type="number"
            name="avgTransactionAmount"
            value={formData.avgTransactionAmount}
            onChange={handleChange}
            min="0"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-risk-info focus:border-transparent"
            required
          />
        </div>

        {/* New Payee */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isNewPayee"
            checked={formData.isNewPayee}
            onChange={handleChange}
            className="w-4 h-4 text-risk-info bg-surface-raised border-border rounded focus:ring-risk-info"
          />
          <label className="ml-2 text-sm font-medium text-ink">
            New Payee
          </label>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-risk-info hover:bg-risk-info/80 disabled:bg-surface-raised text-white font-bold py-3 px-4 rounded-md transition-colors"
          >
            {loading ? "Scoring..." : "🔍 Score Transaction"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-risk-critical/20 border border-risk-critical/50 rounded-md p-4">
          <p className="text-risk-critical">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 bg-surface-raised rounded-lg p-4 border border-border">
          <h3 className="text-lg font-bold text-ink mb-3">📊 Scoring Result</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-ink-faint text-sm">Risk Score</p>
              <p className="text-2xl font-bold text-ink">
                {(result.riskScore * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-ink-faint text-sm">Risk Tier</p>
              <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold ${getRiskColor(result.riskTier)}`}>
                {result.riskTier.toUpperCase()}
              </span>
            </div>
            <div className="col-span-2">
              <p className="text-ink-faint text-sm">Recommendation</p>
              <p className="text-lg font-semibold text-ink">{result.recommendation}</p>
            </div>
          </div>

          <div>
            <p className="text-ink-faint text-sm mb-2">Top Signals</p>
            <ul className="space-y-1">
              {result.signals.map((signal, idx) => (
                <li key={idx} className="text-ink flex items-center">
                  <span className="text-risk-medium mr-2">⚠️</span>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
