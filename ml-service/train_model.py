"""
Trains a fraud detection model on the PaySim-like synthetic dataset.

This script trains a LightGBM classifier for fraud detection with:
- Time-based train/test split (avoids data leakage)
- Class imbalance handling with scale_pos_weight
- SHAP explanations for model interpretability
- Real metrics: PR-AUC and precision@k

Usage:
    python3 ml-service/train_model.py

Output:
    ml-service/model/ (model artifacts)
    mock-data/alerts.json (scored alerts for the dashboard)
"""

import json
import pickle
import random
import warnings
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import lightgbm as lgb
import shap
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
)

warnings.filterwarnings("ignore", category=UserWarning)
random.seed(42)
np.random.seed(42)

DATASET_CONFIG = {
    "name": "PaySim Synthetic",
    "path": "data/PS_20174392719_1491204439457_log.csv",
    "target_column": "isFraud",
    "timestamp_column": "step",
}


def load_dataset(config):
    data_path = Path(__file__).parent / config["path"]
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    print(f"  Loaded {len(df)} rows, fraud rate: {df[config['target_column']].mean()*100:.2f}%")
    return df


def engineer_features(df):
    df = df.copy()
    df["balance_change_orig"] = df["newbalanceOrig"] - df["oldbalanceOrg"]
    df["balance_change_dest"] = df["newbalanceDest"] - df["oldbalanceDest"]
    df["amount_to_balance_ratio"] = df["amount"] / (df["oldbalanceOrg"] + 1)
    df["type_encoded"] = df["type"].map({"CASH_IN": 0, "CASH_OUT": 1, "DEBIT": 2, "PAYMENT": 3, "TRANSFER": 4})
    df["is_transfer"] = (df["type"] == "TRANSFER").astype(int)
    df["is_cash_out"] = (df["type"] == "CASH_OUT").astype(int)
    df["amount_bin"] = pd.cut(df["amount"], bins=[0, 100, 1000, 10000, 100000, float("inf")], labels=[0, 1, 2, 3, 4]).astype(int)
    df["hour_of_day"] = df["step"] % 24
    df["is_night"] = ((df["hour_of_day"] >= 22) | (df["hour_of_day"] <= 6)).astype(int)
    return df


def compute_customer_features(df):
    df = df.copy().sort_values("step").reset_index(drop=True)
    customer_tx_count = {}
    customer_fraud_count = {}
    tx_counts, fraud_counts = [], []
    for _, row in df.iterrows():
        cust = row["nameOrig"]
        tx_count = customer_tx_count.get(cust, 0)
        fraud_count = customer_fraud_count.get(cust, 0)
        tx_counts.append(tx_count)
        fraud_counts.append(fraud_count)
        customer_tx_count[cust] = tx_count + 1
        if row["isFraud"] == 1:
            customer_fraud_count[cust] = fraud_count + 1
    df["customer_tx_count"] = tx_counts
    df["customer_fraud_count"] = fraud_counts
    df["is_new_account"] = (df["customer_tx_count"] < 5).astype(int)
    return df


def train_model(X_train, y_train, X_val, y_val):
    print("\nTraining LightGBM model...")
    n_neg = (y_train == 0).sum()
    n_pos = (y_train == 1).sum()
    spw = n_neg / n_pos
    print(f"  Class imbalance ratio: {spw:.1f}")

    model = lgb.LGBMClassifier(
        n_estimators=500, learning_rate=0.05, max_depth=6, num_leaves=31,
        min_child_samples=20, subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=spw, random_state=42, n_jobs=-1, verbose=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)],
              callbacks=[lgb.early_stopping(stopping_rounds=50), lgb.log_evaluation(period=100)])
    print(f"  Best iteration: {model.best_iteration_}")
    return model


def evaluate_model(model, X_test, y_test, feature_names):
    print("\nEvaluating model...")
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)

    pr_auc = average_precision_score(y_test, y_proba)
    print(f"  PR-AUC: {pr_auc:.4f}")

    precision_at_k = {}
    for k in [10, 25, 50, 100]:
        if k <= len(y_test):
            top_k_idx = np.argsort(y_proba)[-k:][::-1]
            p_at_k = float(y_test.iloc[top_k_idx].mean())
            precision_at_k[f"precision@{k}"] = p_at_k
            print(f"  Precision@{k}: {p_at_k:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))

    tier_cutoffs = {
        "critical": float(np.percentile(y_proba, 95)),
        "high": float(np.percentile(y_proba, 85)),
        "medium": float(np.percentile(y_proba, 70)),
        "low": 0.0,
    }
    print(f"\nTier Cutoffs:")
    for tier, cutoff in tier_cutoffs.items():
        print(f"  {tier}: {cutoff:.4f}")

    fi = pd.DataFrame({"feature": feature_names, "importance": model.feature_importances_}).sort_values("importance", ascending=False)
    print(f"\nTop 10 Features:")
    print(fi.head(10).to_string())

    return {
        "pr_auc": float(pr_auc), "precision_at_k": precision_at_k,
        "tier_cutoffs": tier_cutoffs, "feature_importance": fi,
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }


def compute_shap_explanations(model, X, feature_names, top_k=3):
    print("\nComputing SHAP explanations...")
    explainer = shap.TreeExplainer(model)
    n_samples = min(10000, len(X))
    shap_values = explainer.shap_values(X.iloc[:n_samples])
    if isinstance(shap_values, list):
        shap_values = shap_values[1]

    labels = {
        "amount": "Transaction amount", "type_encoded": "Transaction type",
        "oldbalanceOrg": "Sender balance before", "newbalanceOrig": "Sender balance after",
        "oldbalanceDest": "Recipient balance before", "newbalanceDest": "Recipient balance after",
        "balance_change_orig": "Sender balance change", "balance_change_dest": "Recipient balance change",
        "amount_to_balance_ratio": "Amount relative to balance",
        "is_transfer": "Transfer transaction", "is_cash_out": "Cash-out transaction",
        "amount_bin": "Amount category", "hour_of_day": "Time of day",
        "is_night": "Nighttime transaction", "is_new_account": "New account",
        "customer_tx_count": "Transaction history", "customer_fraud_count": "Prior fraud history",
        "step": "Time step",
    }

    all_signals = []
    for i in range(n_samples):
        abs_shap = np.abs(shap_values[i])
        top_idx = np.argsort(abs_shap)[-top_k:][::-1]
        signals = []
        for idx in top_idx:
            lbl = labels.get(feature_names[idx], feature_names[idx])
            direction = "increases risk" if shap_values[i][idx] > 0 else "decreases risk"
            signals.append(f"{lbl} ({direction})")
        all_signals.append(signals)

    print(f"  Computed SHAP values for {n_samples} samples")
    return all_signals


def generate_alerts_json(df, y_proba, tier_cutoffs, shap_signals, output_path):
    print(f"\nGenerating alerts JSON...")

    def get_tier(score):
        if score >= tier_cutoffs["critical"]: return "critical"
        if score >= tier_cutoffs["high"]: return "high"
        if score >= tier_cutoffs["medium"]: return "medium"
        return "low"

    FN = ["Alex","Jordan","Sam","Taylor","Morgan","Casey","Riley","Priya","Wei","Fatima",
          "Diego","Elena","Noah","Ava","Liam","Olivia","Emma","James","Sophia","Benjamin"]
    LN = ["Chen","Patel","Garcia","Kim","Nguyen","Smith","Ivanov","Okafor","Silva","Rossi",
          "Muller","Tanaka","Johnson","Williams","Brown","Jones","Miller","Davis","Wilson","Taylor"]

    def fake_name(cid):
        h = hash(cid)
        return f"{FN[h % len(FN)]} {LN[(h // len(FN)) % len(LN)]}"

    CAT = {"CASH_IN":"cash_advance","CASH_OUT":"cash_advance","DEBIT":"utilities","PAYMENT":"subscription","TRANSFER":"crypto_exchange"}

    alerts = []
    for i, (_, row) in enumerate(df.iterrows()):
        score = float(y_proba[i])
        alert = {
            "alertId": f"ALT-{300000+i}", "status": "new",
            "riskScore": round(score*100, 1), "riskTier": get_tier(score),
            "isAnomaly": row["isFraud"] == 1,
            "topSignals": shap_signals[i] if i < len(shap_signals) else ["No signal available"],
            "transaction": {
                "transactionId": f"TXN-{200000+i}", "customerId": row["nameOrig"],
                "timestamp": (datetime(2026,1,1,tzinfo=timezone.utc)+timedelta(hours=int(row["step"]))).isoformat(),
                "amount": float(row["amount"]), "currency": "USD",
                "merchantCategory": CAT.get(row["type"], "other"), "country": "US",
                "isNewPayee": row.get("is_new_account", 0) == 1,
                "velocity1h": int(row.get("customer_tx_count", 0) % 10),
                "velocity24h": int(row.get("customer_tx_count", 0) % 50),
                "hourOfDay": int(row["hour_of_day"]),
            },
            "customer": {
                "customerId": row["nameOrig"], "name": fake_name(row["nameOrig"]),
                "accountAgeDays": int(row.get("is_new_account", 0)*30+100),
                "priorDisputes": int(row.get("customer_fraud_count", 0)),
                "avgTransactionAmount": float(row["amount"]),
            },
            "createdAt": (datetime(2026,1,1,tzinfo=timezone.utc)+timedelta(hours=int(row["step"]))).isoformat(),
        }
        if row["isFraud"] == 1:
            alert["caseId"] = f"CASE-{1000+i}"
        alerts.append(alert)

    alerts.sort(key=lambda a: a["riskScore"], reverse=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(alerts, f, indent=2)

    tc = {}
    for a in alerts:
        tc[a["riskTier"]] = tc.get(a["riskTier"], 0) + 1
    print(f"  Saved {len(alerts)} alerts")
    for t in ["critical","high","medium","low"]:
        c = tc.get(t, 0)
        print(f"  {t}: {c} ({c/len(alerts)*100:.1f}%)")


def main():
    print("=" * 60)
    print("Fraud Detection Model Training")
    print("=" * 60)

    df = load_dataset(DATASET_CONFIG)
    print("\nEngineering features...")
    df = engineer_features(df)
    df = compute_customer_features(df)

    feature_columns = [c for c in [
        "amount", "type_encoded", "oldbalanceOrg", "newbalanceOrig",
        "oldbalanceDest", "newbalanceDest", "balance_change_orig",
        "balance_change_dest", "amount_to_balance_ratio", "is_transfer",
        "is_cash_out", "amount_bin", "hour_of_day", "is_night",
        "is_new_account", "customer_tx_count", "customer_fraud_count", "step",
    ] if c in df.columns]

    print(f"\nFeatures: {len(feature_columns)}, Samples: {len(df)}")

    df_sorted = df.sort_values("step").reset_index(drop=True)
    X_sorted = df_sorted[feature_columns]
    y_sorted = df_sorted[DATASET_CONFIG["target_column"]]

    train_size = int(0.7 * len(X_sorted))
    val_size = int(0.15 * len(X_sorted))

    X_train, y_train = X_sorted.iloc[:train_size], y_sorted.iloc[:train_size]
    X_val, y_val = X_sorted.iloc[train_size:train_size+val_size], y_sorted.iloc[train_size:train_size+val_size]
    X_test, y_test = X_sorted.iloc[train_size+val_size:], y_sorted.iloc[train_size+val_size:]

    print(f"\nTime-based split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
    print(f"Fraud rates: train={y_train.mean()*100:.2f}%, val={y_val.mean()*100:.2f}%, test={y_test.mean()*100:.2f}%")

    model = train_model(X_train, y_train, X_val, y_val)
    metrics = evaluate_model(model, X_test, y_test, feature_columns)
    shap_signals = compute_shap_explanations(model, X_test, feature_columns)

    output_path = Path(__file__).resolve().parent.parent / "mock-data" / "alerts.json"
    generate_alerts_json(df_sorted.iloc[train_size+val_size:], model.predict_proba(X_test)[:,1], metrics["tier_cutoffs"], shap_signals, output_path)

    model_dir = Path(__file__).parent / "model"
    model_dir.mkdir(parents=True, exist_ok=True)
    with open(model_dir / "lgbm_model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(model_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2, default=str)
    metrics["feature_importance"].to_csv(model_dir / "feature_importance.csv", index=False)

    print(f"\nModel saved to {model_dir}")
    print("=" * 60)
    print("Training complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()