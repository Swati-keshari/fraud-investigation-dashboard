import { OpsPage } from "@/components/shell/OpsPage";
import { CountUpStat, Sparkline } from "@/components/artifacts/MotionKit";

export default function ReportsPage() {
  return (
    <OpsPage
      title="Reports"
      plain="A report answers: how many alerts, how many we stopped, how many we let through. It is a week in numbers."
    >
      <div className="fact-row">
        <CountUpStat label="alerts reviewed (demo)" value={128} />
        <CountUpStat label="blocked" value={17} />
        <CountUpStat label="opened as cases" value={9} />
      </div>
      <Sparkline />
    </OpsPage>
  );
}
