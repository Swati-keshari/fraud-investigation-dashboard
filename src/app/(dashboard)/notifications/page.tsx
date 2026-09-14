import { OpsPage } from "@/components/shell/OpsPage";
import { LivePulse } from "@/components/artifacts/MotionKit";

export default function NotificationsPage() {
  return (
    <OpsPage
      title="Notifications"
      plain="A notification is a tap on the shoulder: a critical alert arrived, or a case you own moved."
    >
      <LivePulse label="no urgent pings in this demo moment" />
      <ul className="story-steps">
        <li className="story-step">
          <b>•</b>
          <span>Critical score (≥90) — tell the person on shift immediately.</span>
        </li>
        <li className="story-step">
          <b>•</b>
          <span>Case assigned to you — open the folder.</span>
        </li>
      </ul>
    </OpsPage>
  );
}
