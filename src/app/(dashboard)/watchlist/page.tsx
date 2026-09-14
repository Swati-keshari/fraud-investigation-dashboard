import { OpsPage } from "@/components/shell/OpsPage";
import { LivePulse, StampMark } from "@/components/artifacts/MotionKit";

export default function WatchlistPage() {
  return (
    <OpsPage
      title="Watchlist"
      plain="Some shops or countries appear in many fraud stories. They are not always guilty — they just get extra attention."
    >
      <LivePulse label="watchlist is quiet until something matches" />
      <table className="plain-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Entry</th>
            <th>Why it is here</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Brand-new jewellery merchants</td>
            <td>High value, easy to vanish</td>
          </tr>
          <tr>
            <td>Overnight crypto cash-out</td>
            <td>Hard to reverse</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: "1rem" }}>
        <StampMark text="WATCH" />
      </div>
    </OpsPage>
  );
}
