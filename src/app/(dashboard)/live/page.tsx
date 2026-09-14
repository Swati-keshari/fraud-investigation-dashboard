import { OpsPage } from "@/components/shell/OpsPage";
import { LivePulse, RadarSweep, TickerTape } from "@/components/artifacts/MotionKit";

export default function LivePage() {
  return (
    <OpsPage
      title="Live watch"
      plain="Fraud does not wait for a refresh button. This screen is the heartbeat: new alerts appear as they are scored."
    >
      <LivePulse label="listening for new payments" />
      <RadarSweep />
      <TickerTape
        items={[
          "A-9K2 scored 91 — critical",
          "A-3F1 scored 22 — low",
          "Case C-18 moved to looking",
        ]}
      />
    </OpsPage>
  );
}
