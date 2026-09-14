"""LightGBM scoring API for Render.

Maps the dashboard's practice-lab fields onto the 18 features the pickled
classifier was trained on, then returns a probability, risk tier, and the
top contributing signals.
"""

from __future__ import annotations

import json
import os
import pickle
from pathlib import Path

import numpy as np
from flask import Flask, jsonify, request

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "model" / "lgbm_model.pkl"
METRICS_PATH = ROOT / "model" / "metrics.json"

FEATURE_NAMES = [
    "amount",
    "type_encoded",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "balance_change_orig",
    "balance_change_dest",
    "amount_to_balance_ratio",
    "is_transfer",
    "is_cash_out",
    "amount_bin",
    "hour_of_day",
    "is_night",
    "is_new_account",
    "customer_tx_count",
    "customer_fraud_count",
    "step",
]

FEATURE_LABELS = {
    "amount": "Transaction amount",
    "type_encoded": "Transaction type",
    "oldbalanceOrg": "Sender balance before",
    "newbalanceOrig": "Sender balance after",
    "oldbalanceDest": "Recipient balance before",
    "newbalanceDest": "Recipient balance after",
    "balance_change_orig": "Sender balance change",
    "balance_change_dest": "Recipient balance change",
    "amount_to_balance_ratio": "Amount relative to balance",
    "is_transfer": "Transfer transaction",
    "is_cash_out": "Cash-out transaction",
    "amount_bin": "Amount category",
    "hour_of_day": "Time of day",
    "is_night": "Nighttime transaction",
    "is_new_account": "New account",
    "customer_tx_count": "Transaction history",
    "customer_fraud_count": "Prior fraud history",
    "step": "Time step",
}

MERCHANT_TO_TYPE = {
    "cash_advance": 1,
    "jewelry": 4,
    "jewellery": 4,
    "electronics": 4,
    "crypto_exchange": 4,
    "utilities": 2,
    "subscription": 3,
    "grocery": 3,
    "other": 3,
}

app = Flask(__name__)

_model = None
_cutoffs = {"critical": 0.42, "high": 0.36, "medium": 0.25, "low": 0.0}


def load_model():
    global _model, _cutoffs
    if _model is not None:
        return _model
    with MODEL_PATH.open("rb") as fh:
        _model = pickle.load(fh)
    if METRICS_PATH.exists():
        metrics = json.loads(METRICS_PATH.read_text())
        _cutoffs = metrics.get("tier_cutoffs", _cutoffs)
    return _model


def amount_bin(amount: float) -> int:
    if amount < 100:
        return 0
    if amount < 1000:
        return 1
    if amount < 10000:
        return 2
    if amount < 100000:
        return 3
    return 4


def features_from_body(body: dict) -> list[float]:
    amount = float(body.get("amount") or 0)
    hour = int(body.get("hourOfDay") or 12)
    is_new_payee = bool(body.get("isNewPayee"))
    account_age = int(body.get("accountAgeDays") or 365)
    prior = int(body.get("priorDisputes") or 0)
    vel24 = int(body.get("velocity24h") or body.get("velocity1h") or 0)
    avg = float(body.get("avgTransactionAmount") or amount or 1)
    merchant = str(body.get("merchantCategory") or "other").lower()

    type_encoded = MERCHANT_TO_TYPE.get(merchant, 3)
    is_transfer = 1.0 if type_encoded == 4 else 0.0
    is_cash_out = 1.0 if type_encoded == 1 else 0.0
    old_orig = max(avg * 20.0, amount * 2.0, 1.0)
    new_orig = max(0.0, old_orig - amount)
    old_dest = 0.0 if is_new_payee else max(avg * 5.0, 1.0)
    new_dest = old_dest + amount
    is_night = 1.0 if hour >= 22 or hour <= 6 else 0.0
    is_new_account = 1.0 if account_age < 30 or is_new_payee else 0.0

    return [
        amount,
        float(type_encoded),
        old_orig,
        new_orig,
        old_dest,
        new_dest,
        new_orig - old_orig,
        new_dest - old_dest,
        amount / (old_orig + 1.0),
        is_transfer,
        is_cash_out,
        float(amount_bin(amount)),
        float(hour),
        is_night,
        is_new_account,
        float(vel24),
        float(prior),
        float(max(hour, 1)),
    ]


def tier_from_proba(p: float) -> str:
    if p >= float(_cutoffs.get("critical", 0.42)):
        return "critical"
    if p >= float(_cutoffs.get("high", 0.36)):
        return "high"
    if p >= float(_cutoffs.get("medium", 0.25)):
        return "medium"
    return "low"


def top_signals(model, row: np.ndarray) -> list[str]:
    booster = getattr(model, "booster_", None)
    if booster is None:
        return ["LightGBM probability only"]
    contrib = booster.predict(row, pred_contrib=True)[0]
    pairs = list(zip(FEATURE_NAMES, contrib[:-1]))
    pairs.sort(key=lambda item: abs(float(item[1])), reverse=True)
    signals = []
    for name, value in pairs[:3]:
        direction = "increases risk" if value > 0 else "decreases risk"
        label = FEATURE_LABELS.get(name, name)
        signals.append(f"{label} ({direction})")
    return signals or ["No significant risk signals"]


def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return resp


@app.after_request
def add_cors(resp):
    return cors(resp)


PAGE_CSS = """
@import url("https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Fraunces:opsz,wght@9..144,500;9..144,650&display=swap");
:root {
  --ink: #071018;
  --panel: #101a24;
  --line: #2a3a48;
  --paper: #f2ead7;
  --brass: #c9a05a;
  --ok: #3cbf8a;
  --warn: #e07a5f;
}
* { box-sizing: border-box; }
html, body { min-height: 100%; }
body {
  margin: 0;
  background:
    radial-gradient(1200px 500px at 80% -10%, rgba(201,160,90,0.12), transparent 55%),
    linear-gradient(180deg, #0b1822 0%, var(--ink) 40%);
  color: var(--paper);
  font-family: Figtree, system-ui, sans-serif;
  line-height: 1.55;
}
a { color: var(--brass); }
.shell {
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) 1fr;
  min-height: 100vh;
}
aside {
  border-right: 1px solid var(--line);
  padding: 1.5rem 1.25rem;
  background: #0a141c;
}
aside p { margin: 0 0 0.35rem; color: #8fa3b5; font-size: 0.82rem; }
aside h2 {
  font-family: Fraunces, Georgia, serif;
  font-size: 1.35rem;
  font-weight: 650;
  margin: 0 0 1.5rem;
}
aside nav { display: flex; flex-direction: column; gap: 0.55rem; }
main { padding: 2.25rem clamp(1.25rem, 4vw, 3.5rem) 3rem; max-width: 58rem; }
.live {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--ok);
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
}
.live::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--ok);
  box-shadow: 0 0 0 4px rgba(60,191,138,0.18);
}
h1 {
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.1rem);
  font-weight: 650;
  line-height: 1.15;
  margin: 0 0 0.75rem;
}
.lede { max-width: 38rem; color: #d7cbb3; margin: 0 0 1.75rem; }
.desk {
  display: grid;
  grid-template-columns: minmax(16rem, 22rem) minmax(16rem, 1fr);
  gap: 1.25rem;
}
form, .result {
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 1.15rem 1.2rem 1.3rem;
}
form h3, .result h3 {
  font-family: Fraunces, Georgia, serif;
  margin: 0 0 0.85rem;
  font-size: 1.15rem;
}
label { display: block; margin-top: 0.7rem; font-size: 0.9rem; }
input[type="number"], input[type="text"] {
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem 0.55rem;
  background: #071018;
  color: var(--paper);
  border: 1px solid var(--line);
}
.check { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.9rem; }
button {
  margin-top: 1.1rem;
  padding: 0.65rem 1rem;
  background: var(--brass);
  color: #071018;
  border: 0;
  font-weight: 600;
  cursor: pointer;
}
.pct {
  font-family: Fraunces, Georgia, serif;
  font-size: 3rem;
  line-height: 1;
  margin: 0.2rem 0;
}
.tier { font-weight: 600; letter-spacing: 0.04em; }
.tier.critical, .tier.high { color: var(--warn); }
.tier.medium { color: var(--brass); }
.tier.low { color: var(--ok); }
.result ul { margin: 0.6rem 0 0; padding-left: 1.1rem; }
.result .wait { color: #8fa3b5; }
code { background: #17232f; padding: 0.08rem 0.35rem; font-size: 0.9em; }
.foot { margin-top: 1.75rem; color: #8fa3b5; font-size: 0.88rem; }
@media (max-width: 820px) {
  .shell, .desk { grid-template-columns: 1fr; }
  aside { border-right: 0; border-bottom: 1px solid var(--line); }
}
"""

SCORE_SCRIPT = """
<script>
function bindScoreForm() {
  const form = document.getElementById("f");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      amount: Number(fd.get("amount")),
      merchantCategory: fd.get("merchantCategory"),
      hourOfDay: Number(fd.get("hourOfDay")),
      isNewPayee: fd.get("isNewPayee") === "on",
      velocity1h: 8,
      velocity24h: 25,
      accountAgeDays: 15,
      priorDisputes: 2,
      avgTransactionAmount: 500
    };
    const box = document.getElementById("out");
    box.innerHTML = "<p class='wait'>Scoring with LightGBM…</p>";
    try {
      const res = await fetch("/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      const pct = Math.round((data.riskScore || 0) * 1000) / 10;
      const signals = (data.signals || []).map((s) => "<li>" + s + "</li>").join("");
      box.innerHTML =
        "<p class='pct'>" + pct + "%</p>" +
        "<p class='tier " + (data.riskTier || "") + "'>" + String(data.riskTier || "").toUpperCase() + "</p>" +
        "<p>" + (data.recommendation || "") + "</p>" +
        "<ul>" + signals + "</ul>";
    } catch (err) {
      box.innerHTML = "<p class='tier high'>Could not reach the model. Wait for Render to wake, then try again.</p>";
    }
  });
}
bindScoreForm();
</script>
"""

LANDING_HTML = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Watch Desk — live LightGBM</title>
  <style>{PAGE_CSS}</style>
</head>
<body>
  <div class="shell">
    <aside>
      <p>Swati Keshari</p>
      <h2>Watch Desk</h2>
      <nav>
        <a href="https://watch-desk-web.onrender.com/">Full Watch Desk</a>
        <a href="/">Score a payment</a>
        <a href="/health">Health (JSON)</a>
        <a href="https://github.com/Swati-keshari/fraud-investigation-dashboard">GitHub</a>
      </nav>
    </aside>
    <main>
      <p class="live">This page is the model API. The full desk is a separate Render service.</p>
      <h1>Is this payment risky?</h1>
      <p class="lede">The investigation UI (word list, alerts, cases, practice lab) is already on Render: <a href="https://watch-desk-web.onrender.com/">watch-desk-web.onrender.com</a>. This service only scores a payment with LightGBM.</p>
      <div class="desk">
        <form id="f">
          <h3>Try a payment</h3>
          <label>Amount <input name="amount" type="number" value="15000" required /></label>
          <label>Merchant <input name="merchantCategory" type="text" value="jewelry" /></label>
          <label>Hour (0–23) <input name="hourOfDay" type="number" value="2" min="0" max="23" /></label>
          <label class="check"><input name="isNewPayee" type="checkbox" checked /> New payee</label>
          <button type="submit">Score with LightGBM</button>
        </form>
        <div class="result">
          <h3>Model reply</h3>
          <div id="out"><p class="wait">Result appears here after you score.</p></div>
        </div>
      </div>
      <p class="foot">Apps and the practice lab POST JSON to <code>/score</code>. First load after sleep can take about 30 seconds.</p>
    </main>
  </div>
  {SCORE_SCRIPT}
</body>
</html>
"""

SCORE_FORM_HTML = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Score a payment — Watch Desk</title>
  <style>{PAGE_CSS}</style>
</head>
<body>
  <div class="shell">
    <aside>
      <p>Swati Keshari</p>
      <h2>Watch Desk</h2>
      <nav>
        <a href="https://watch-desk-web.onrender.com/">Full Watch Desk</a>
        <a href="/">Home</a>
        <a href="/score">Score a payment</a>
        <a href="/health">Health (JSON)</a>
      </nav>
    </aside>
    <main>
      <p class="live">Same model as the homepage</p>
      <h1>Score a payment</h1>
      <p class="lede">This page is a bookmark for the scoring form. It calls the same LightGBM endpoint.</p>
      <div class="desk">
        <form id="f">
          <h3>Try a payment</h3>
          <label>Amount <input name="amount" type="number" value="15000" required /></label>
          <label>Merchant <input name="merchantCategory" type="text" value="jewelry" /></label>
          <label>Hour (0–23) <input name="hourOfDay" type="number" value="2" min="0" max="23" /></label>
          <label class="check"><input name="isNewPayee" type="checkbox" checked /> New payee</label>
          <button type="submit">Score with LightGBM</button>
        </form>
        <div class="result">
          <h3>Model reply</h3>
          <div id="out"><p class="wait">Result appears here after you score.</p></div>
        </div>
      </div>
    </main>
  </div>
  {SCORE_SCRIPT}
</body>
</html>
"""


@app.route("/", methods=["GET"])
def root():
    if request.args.get("format") == "json":
        return jsonify(
            {
                "service": "Watch Desk LightGBM",
                "author": "Swati Keshari",
                "production": {
                    "home": "https://watch-desk-lgbm.onrender.com/",
                    "health": "https://watch-desk-lgbm.onrender.com/health",
                    "score": "https://watch-desk-lgbm.onrender.com/score",
                    "github": "https://github.com/Swati-keshari/fraud-investigation-dashboard",
                },
            }
        )
    return LANDING_HTML, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/health", methods=["GET"])
def health():
    load_model()
    return jsonify(
        {
            "status": "ok",
            "model": "lgbm",
            "features": len(FEATURE_NAMES),
            "links": {
                "home": "https://watch-desk-lgbm.onrender.com/",
                "score": "https://watch-desk-lgbm.onrender.com/score",
            },
        }
    )


@app.route("/score", methods=["GET", "POST", "OPTIONS"])
def score():
    if request.method == "OPTIONS":
        return cors(app.make_response(("", 204)))
    if request.method == "GET":
        return SCORE_FORM_HTML, 200, {"Content-Type": "text/html; charset=utf-8"}
    model = load_model()
    body = request.get_json(silent=True) or {}
    row = np.array([features_from_body(body)], dtype=float)
    proba = float(model.predict_proba(row)[0][1])
    tier = tier_from_proba(proba)
    recommendation = (
        "Block and investigate"
        if tier == "critical"
        else "Review manually"
        if tier == "high"
        else "Monitor closely"
        if tier == "medium"
        else "Approve"
    )
    return jsonify(
        {
            "engine": "lightgbm",
            "riskScore": proba,
            "riskTier": tier,
            "signals": top_signals(model, row),
            "recommendation": recommendation,
        }
    )


if __name__ == "__main__":
    load_model()
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
