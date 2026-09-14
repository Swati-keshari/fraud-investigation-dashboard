import { OpsPage } from "@/components/shell/OpsPage";

export default function SettingsPage() {
  return (
    <OpsPage
      title="Settings"
      plain="Settings change how noisy the desk is: which risk band is ‘critical’, whether live updates are on."
    >
      <ol className="story-steps">
        <li className="story-step">
          <b>1</b>
          <span>Theme stays dark so risk colours (red, amber, green) stay readable.</span>
        </li>
        <li className="story-step">
          <b>2</b>
          <span>Keyboard jump (⌘K) stays on so you can search without the mouse.</span>
        </li>
        <li className="story-step">
          <b>3</b>
          <span>If the Express backend is off, the app still loads demo data from server actions.</span>
        </li>
      </ol>
    </OpsPage>
  );
}
