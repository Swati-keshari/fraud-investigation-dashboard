"""
Generates a synthetic dataset that mimics PaySim's structure for fraud detection.

This version has a higher fraud rate (~5%) and more distinct fraud patterns
to enable effective model training.

Usage:
    python3 ml-service/generate_paysim_synthetic.py

Output:
    ml-service/data/PS_20174392719_1491204439457_log.csv
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from pathlib import Path

random.seed(42)
np.random.seed(42)

N_TRANSACTIONS = 100000
N_CUSTOMERS = 5000
FRAUD_RATE = 0.05  # 5% fraud rate

TRANSACTION_TYPES = {
    "CASH_IN": 0.20, "CASH_OUT": 0.35, "DEBIT": 0.05,
    "PAYMENT": 0.25, "TRANSFER": 0.15,
}

FRAUD_PROBABILITY_BY_TYPE = {
    "CASH_IN": 0.01, "CASH_OUT": 0.08, "DEBIT": 0.02,
    "PAYMENT": 0.03, "TRANSFER": 0.12,
}

AMOUNT_RANGES = {
    "CASH_IN": (10, 5000), "CASH_OUT": (10, 10000), "DEBIT": (5, 2000),
    "PAYMENT": (5, 5000), "TRANSFER": (10, 20000),
}


def generate_customer(customer_id):
    balance = np.random.lognormal(mean=8, sigma=1.5)
    balance = max(100, min(balance, 500000))
    account_age_days = int(np.random.exponential(scale=365)) + 1
    prior_transactions = np.random.poisson(lam=50)
    return {
        "customerId": f"C{customer_id:06d}", "balance": round(balance, 2),
        "accountAgeDays": account_age_days, "priorTransactions": prior_transactions,
    }


def generate_transaction(transaction_id, customer, timestamp, customers, fraud_override=False):
    tx_type = random.choices(list(TRANSACTION_TYPES.keys()), weights=list(TRANSACTION_TYPES.values()))[0]
    min_amt, max_amt = AMOUNT_RANGES[tx_type]

    # Determine if fraud
    fraud_prob = FRAUD_PROBABILITY_BY_TYPE[tx_type]
    if customer["accountAgeDays"] < 30:
        fraud_prob *= 3
    if customer["priorTransactions"] < 5:
        fraud_prob *= 2

    is_fraud = fraud_override or (random.random() < fraud_prob)

    # Fraud characteristics: larger amounts, unusual patterns
    if is_fraud:
        amount = np.random.lognormal(mean=np.log(max_amt * 0.7), sigma=0.5)
        amount = max(min_amt * 5, min(amount, max_amt * 2))
    else:
        amount = np.random.lognormal(mean=np.log((min_amt + max_amt) / 4), sigma=0.8)
        amount = max(min_amt, min(amount, max_amt))
    amount = round(amount, 2)

    # Balance changes
    old_balance = customer["balance"]
    if tx_type == "CASH_IN":
        new_balance = old_balance + amount
    elif tx_type in ["CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]:
        new_balance = max(0, old_balance - amount)
    else:
        new_balance = old_balance
    customer["balance"] = new_balance

    step = int((timestamp - datetime(2026, 1, 1, tzinfo=timezone.utc)).total_seconds() // 3600)

    return {
        "step": step, "type": tx_type, "amount": amount,
        "nameOrig": customer["customerId"],
        "oldbalanceOrg": old_balance, "newbalanceOrig": new_balance,
        "nameDest": f"C{random.randint(0, N_CUSTOMERS-1):06d}",
        "oldbalanceDest": 0, "newbalanceDest": 0,
        "isFraud": int(is_fraud), "isFlaggedFraud": int(amount > 10000),
    }


def main():
    print("Generating synthetic PaySim dataset (improved)...")
    output_dir = Path(__file__).parent / "data"
    output_dir.mkdir(parents=True, exist_ok=True)

    customers = {f"C{i:06d}": generate_customer(i) for i in range(N_CUSTOMERS)}
    transactions = []
    start_time = datetime(2026, 1, 1, tzinfo=timezone.utc)

    for i in range(N_TRANSACTIONS):
        cid = random.choice(list(customers.keys()))
        customer = customers[cid]
        hours_offset = random.randint(0, 30 * 24)
        timestamp = start_time + timedelta(hours=hours_offset)

        # Force some fraud transactions to ensure minimum fraud rate
        force_fraud = (i % int(1/FRAUD_RATE)) == 0
        tx = generate_transaction(i, customer, timestamp, customers, fraud_override=force_fraud)
        transactions.append(tx)

    df = pd.DataFrame(transactions).sort_values("step").reset_index(drop=True)
    output_path = output_dir / "PS_20174392719_1491204439457_log.csv"
    df.to_csv(output_path, index=False)

    print(f"Total: {len(df)}, Fraud: {df['isFraud'].sum()} ({df['isFraud'].mean()*100:.2f}%)")
    print(f"By type:\n{df.groupby('type')['isFraud'].agg(['sum','mean']).to_string()}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()