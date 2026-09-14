"use client";

import { useState } from "react";
import { ML_SCORE_URL } from "@/lib/mlScore";

type ScoreResult = {
  engine?: string;
  riskScore: number;
  riskTier: string;
  recommendation: string;
  signals: string[];
};

export function LiveModelPanel() {
  const [amount, setAmount] = useState("15000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  async function onScore() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(ML_SCORE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          merchantCategory: "jewelry",
          country: "NG",
          isNewPayee: true,
          velocity1h: 8,
          velocity24h: 25,
          hourOfDay: 2,
          accountAgeDays: 15,
          priorDisputes: 2,
          avgTransactionAmount: 500,
        }),
      });
      if (!response.ok) throw new Error("The live model did not answer.");
      setResult((await response.json()) as ScoreResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach LightGBM.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="live-model" aria-labelledby="live-model-title">
      <h2 id="live-model-title">Live LightGBM (inside this website)</h2>
      <p>
        This button calls the production model at{" "}
        <a href="https://watch-desk-lgbm.onrender.com/">watch-desk-lgbm.onrender.com</a>
        . The alert list below still shows saved demo scores; this box is the live brain.
      </p>
      <label>
        Amount
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
        />
      </label>
      <button type="button" onClick={onScore} disabled={busy}>
        {busy ? "Asking the model…" : "Score with LightGBM"}
      </button>
      {error ? <p className="live-model__err">{error}</p> : null}
      {result ? (
        <div className="live-model__out">
          <p>
            Engine: <strong>{result.engine ?? "lightgbm"}</strong>
          </p>
          <p>
            Score {(result.riskScore * 100).toFixed(1)}% · {result.riskTier} · {result.recommendation}
          </p>
          <ul>
            {result.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
