import Link from "next/link";
import { OpsPage } from "@/components/shell/OpsPage";
import { LiveModelPanel } from "@/components/shell/LiveModelPanel";
import {
  CasePipeline,
  CountUpStat,
  LivePulse,
  MoneyFlow,
  RiskMeter,
  ShieldScan,
  TickerTape,
} from "@/components/artifacts/MotionKit";

export default function HomePage() {
  return (
    <OpsPage
      title="Someone sent money. The computer is unsure."
      plain="This website is a watch desk. It shows payments that look unusual, then a person decides: let it through, stop it, or open a case. The box below talks to the live LightGBM model."
    >
      <LiveModelPanel />
      <TickerTape
        items={[
          "Night transfer ₹48,200 — new payee",
          "Jewellery shop, first-time customer",
          "Eight payments in one hour",
          "Old account, grocery, midday — looks normal",
        ]}
      />
      <div className="story-grid" style={{ marginTop: "1.25rem" }}>
        <div>
          <MoneyFlow />
          <ol className="story-steps">
            <li className="story-step">
              <b>1</b>
              <span>A payment happens. The computer gives it a risk number from 0 (calm) to 100 (alarm).</span>
            </li>
            <li className="story-step">
              <b>2</b>
              <span>High numbers wait in the alert queue. You read why it looks odd.</span>
            </li>
            <li className="story-step">
              <b>3</b>
              <span>If it still looks wrong, you open a case — a folder that follows the story until it is finished.</span>
            </li>
            <li className="story-step">
              <b>4</b>
              <span>Every click is written in “Who did what”, so nobody can hide a decision.</span>
            </li>
          </ol>
          <p style={{ marginTop: "1.1rem" }}>
            <Link href="/alerts" className="text-risk-info underline">
              Open the alert queue
            </Link>
            {" · "}
            <Link href="/learn" className="text-risk-info underline">
              Classroom words
            </Link>
          </p>
        </div>
        <div className="fact-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <LivePulse label="Desk is live" />
          <RiskMeter score={86} />
          <ShieldScan />
          <CountUpStat label="example alerts in the demo set" value={240} />
          <CasePipeline />
        </div>
      </div>
    </OpsPage>
  );
}
