import { OpsPage } from "@/components/shell/OpsPage";
import { RiskMeter } from "@/components/artifacts/MotionKit";

export default function RiskLessonPage() {
  return (
    <OpsPage
      title="Risk scores"
      plain="0 means ‘this looks like everyday life’. 100 means ‘this looks like a theft in progress’. The number is a ranking, not proof."
    >
      <div className="fact-row">
        <RiskMeter score={12} />
        <RiskMeter score={54} />
        <RiskMeter score={91} />
      </div>
      <table className="plain-table">
        <thead>
          <tr>
            <th>Band</th>
            <th>What a student should think</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Low</td>
            <td>Probably fine. Skim it.</td>
          </tr>
          <tr>
            <td>Medium</td>
            <td>Pause. One weird clue is not enough.</td>
          </tr>
          <tr>
            <td>High / critical</td>
            <td>Treat as urgent. Read clues, then decide or escalate.</td>
          </tr>
        </tbody>
      </table>
    </OpsPage>
  );
}
