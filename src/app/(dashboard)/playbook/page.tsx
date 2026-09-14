import { OpsPage } from "@/components/shell/OpsPage";
import { CasePipeline } from "@/components/artifacts/MotionKit";

export default function PlaybookPage() {
  return (
    <OpsPage
      title="Playbook"
      plain="When you are unsure, follow the same steps every time. That is how a class-10 student and a bank analyst stay fair."
    >
      <CasePipeline />
      <ol className="story-steps">
        <li className="story-step">
          <b>1</b>
          <span>Read the amount and the time. Would this person usually do this?</span>
        </li>
        <li className="story-step">
          <b>2</b>
          <span>Read the top 3 reasons the computer listed. Do they make sense?</span>
        </li>
        <li className="story-step">
          <b>3</b>
          <span>If it looks like a mistake, approve. If it looks stolen, decline. If you cannot tell, open a case.</span>
        </li>
        <li className="story-step">
          <b>4</b>
          <span>Write one sentence in the log: what you saw and what you did.</span>
        </li>
      </ol>
    </OpsPage>
  );
}
