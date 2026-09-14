import { OpsPage } from "@/components/shell/OpsPage";
import { Sparkline, RadarSweep } from "@/components/artifacts/MotionKit";

export default function AnalyticsPage() {
  return (
    <OpsPage
      title="Charts"
      plain="Charts show patterns: night spikes, jewellery spikes, new-account spikes. A pattern is a hint for better rules."
    >
      <Sparkline />
      <RadarSweep />
      <p style={{ maxWidth: "38rem", marginTop: "1rem" }}>
        If most critical alerts happen at 2am to new payees, teach the queue to sort those first.
        That is all ‘analytics’ means here.
      </p>
    </OpsPage>
  );
}
