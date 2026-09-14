"use client";

import { useEffect, useState } from "react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function RiskMeter({ score = 78 }: { score?: number }) {
  const reduced = usePrefersReducedMotion();
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="artifact risk-meter" aria-label={`Risk score ${clamped} out of 100`}>
      <svg viewBox="0 0 120 70" role="img">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.2" />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke="var(--brass)"
          strokeWidth="8"
          strokeDasharray={`${(clamped / 100) * 157} 157`}
          className={reduced ? undefined : "draw-stroke"}
        />
      </svg>
      <strong>{clamped}</strong>
      <span>risk out of 100</span>
    </div>
  );
}

export function MoneyFlow() {
  return (
    <div className="artifact money-flow" aria-hidden="true">
      <span className="node">You</span>
      <span className="track">
        <i className="coin" />
        <i className="coin coin-2" />
        <i className="coin coin-3" />
      </span>
      <span className="node node-warn">New shop</span>
    </div>
  );
}

export function ShieldScan() {
  return (
    <div className="artifact shield-scan" aria-hidden="true">
      <div className="shield">
        <div className="beam" />
      </div>
      <p>Watching this payment</p>
    </div>
  );
}

export function LivePulse({ label = "queue is awake" }: { label?: string }) {
  return (
    <div className="artifact live-pulse">
      <span className="dot" />
      <span className="ring" />
      <p>{label}</p>
    </div>
  );
}

export function CasePipeline() {
  const stages = ["Opened", "Looking", "Ask a lead", "Done"];
  return (
    <ol className="artifact case-pipeline">
      {stages.map((stage, i) => (
        <li key={stage} style={{ animationDelay: `${i * 180}ms` }}>
          <b>{i + 1}</b>
          {stage}
        </li>
      ))}
    </ol>
  );
}

export function CountUpStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) {
      setN(value);
      return;
    }
    setN(0);
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 24));
    const timer = window.setInterval(() => {
      current = Math.min(value, current + step);
      setN(current);
      if (current >= value) window.clearInterval(timer);
    }, 32);
    return () => window.clearInterval(timer);
  }, [value, reduced]);
  return (
    <div className="artifact count-stat">
      <strong>
        {n}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}

export function TickerTape({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="artifact ticker" aria-label="Recent alerts">
      <div className="ticker__track">
        {loop.map((item, i) => (
          <span key={`${item}-${i}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export function EvidenceDraw() {
  return (
    <svg className="artifact evidence-draw" viewBox="0 0 280 80" aria-hidden="true">
      <path className="draw-stroke" d="M10 40 L70 40 L90 18 L130 62 L160 40 L270 40" fill="none" stroke="var(--brass)" strokeWidth="3" />
      <circle cx="90" cy="18" r="5" fill="var(--signal)" />
      <circle cx="130" cy="62" r="5" fill="var(--brass)" />
    </svg>
  );
}

export function NetworkRipple() {
  return (
    <div className="artifact network" aria-hidden="true">
      <span className="hub" />
      <span className="sat sat-a" />
      <span className="sat sat-b" />
      <span className="sat sat-c" />
    </div>
  );
}

export function StampMark({ text = "SAFE" }: { text?: string }) {
  return (
    <div className="artifact stamp" aria-hidden="true">
      {text}
    </div>
  );
}

export function Sparkline() {
  return (
    <svg className="artifact sparkline" viewBox="0 0 200 48" aria-hidden="true">
      <polyline
        className="draw-stroke"
        fill="none"
        stroke="var(--safe)"
        strokeWidth="2"
        points="0,30 20,28 40,32 60,18 80,22 100,10 120,16 140,8 160,14 180,6 200,12"
      />
    </svg>
  );
}

export function RadarSweep() {
  return (
    <div className="artifact radar" aria-hidden="true">
      <div className="radar__sweep" />
      <span className="blip" />
    </div>
  );
}
