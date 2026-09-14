import { OpsPage } from "@/components/shell/OpsPage";
import { RadarSweep } from "@/components/artifacts/MotionKit";

export default function RulesPage() {
  return (
    <OpsPage
      title="Rules"
      plain="A rule is a sentence the computer can follow. Example: if amount is huge and the shop is new, raise a hand."
    >
      <RadarSweep />
      <ol className="story-steps">
        <li className="story-step">
          <b>A</b>
          <span>If the payee is new and the amount is more than 20× the usual spend, mark high.</span>
        </li>
        <li className="story-step">
          <b>B</b>
          <span>If more than 6 payments happen in 1 hour, mark medium.</span>
        </li>
        <li className="story-step">
          <b>C</b>
          <span>If the account is older than 2 years and the shop is grocery at noon, stay calm.</span>
        </li>
      </ol>
    </OpsPage>
  );
}
